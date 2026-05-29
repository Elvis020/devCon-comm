import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { PDFParse } from 'pdf-parse';
import { SIMULATED_DELAY_MS } from '@/lib/constants';
import { compareSecretAnswer, hashSecretAnswer } from '@/lib/account-claim';
import { createEvent, getAllEvents, getEventById, updateEvent } from '@/lib/mock-db/events';
import { createQuestion, deleteQuestion, getQuestionById, getQuestionsBySession, reorderQuestions, updateQuestion } from '@/lib/mock-db/questions';
import { readData, writeData } from '@/lib/mock-db';
import { createQuizParticipant, getQuizParticipantBySessionAndUser, getQuizParticipantsBySession, updateQuizParticipant } from '@/lib/mock-db/quiz-participants';
import { createQuizSession, getAllQuizSessions, getQuizSessionByCode, getQuizSessionById, getQuizSessionsByEvent, updateQuizSession } from '@/lib/mock-db/quiz-sessions';
import { createResponse, getResponseByQuestionAndUser, getResponsesByQuestion } from '@/lib/mock-db/responses';
import { addSpeaker, getSpeakerByEmail, getSpeakersByEvent, removeSpeaker } from '@/lib/mock-db/speakers';
import { createTalk, getAllTalks, getTalkById, getTalksByEvent, updateTalk } from '@/lib/mock-db/talks';
import { createUser, getAllUsers, getUserByDeviceId, getUserById, updateUser } from '@/lib/mock-db/users';
import { calculatePoints, calculateStreakBonus } from '@/lib/scoring';
import { now } from '@/lib/utils';
import type { Context } from 'hono';
import type { GeneratedQuizFromPaperResponse, LeaderboardEntry, Question, QuizParticipant, QuizStateResponse, Response, User } from '@/types';

const app = new Hono();
const ADMIN_SESSION_COOKIE = 'devcon_admin';
const PAPER_QUIZ_MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const PAPER_QUIZ_MAX_TEXT_CHARS = 60_000;
const PAPER_QUIZ_MIN_TEXT_CHARS = 350;
const PAPER_QUIZ_DEFAULT_QUESTION_COUNT = 5;
const PAPER_QUIZ_MAX_QUESTION_COUNT = 8;
const PAPER_QUIZ_GENERATION_NOTE = 'Prototype rule-based generation from extracted PDF text. Review and edit every question before going live.';
const STOP_WORDS = new Set([
  'about',
  'above',
  'after',
  'again',
  'against',
  'also',
  'among',
  'analysis',
  'another',
  'because',
  'before',
  'being',
  'between',
  'could',
  'during',
  'example',
  'first',
  'following',
  'from',
  'have',
  'into',
  'more',
  'most',
  'other',
  'over',
  'paper',
  'resource',
  'same',
  'such',
  'than',
  'that',
  'their',
  'there',
  'these',
  'this',
  'those',
  'through',
  'under',
  'using',
  'where',
  'which',
  'while',
  'with',
  'would',
]);

function envValue(key: string): string | undefined {
  return typeof Bun === 'undefined' ? process.env[key] : Bun.env[key];
}

function adminPassword(): string {
  return envValue('ADMIN_PASSWORD') ?? 'devcon-admin';
}

function adminSessionToken(): string {
  return envValue('ADMIN_SESSION_SECRET') ?? 'devcon-local-session';
}

function isAdminRequest(c: Context): boolean {
  return getCookie(c, ADMIN_SESSION_COOKIE) === adminSessionToken();
}

function requireAdmin(c: Context): globalThis.Response | null {
  if (isAdminRequest(c)) {
    return null;
  }

  return c.json({ error: 'Admin session required' }, 401);
}

app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    runtime: typeof Bun === 'undefined' ? 'vite-dev-server' : 'bun',
  });
});

app.get('/api/auth/session', (c) => {
  return c.json({
    authenticated: isAdminRequest(c),
  });
});

app.post('/api/auth/admin/login', async (c) => {
  const { password } = await c.req.json();

  if (String(password ?? '') !== adminPassword()) {
    return c.json({ error: 'Invalid admin password' }, 401);
  }

  setCookie(c, ADMIN_SESSION_COOKIE, adminSessionToken(), {
    httpOnly: true,
    sameSite: 'Lax',
    secure: envValue('NODE_ENV') === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return c.json({ authenticated: true });
});

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, ADMIN_SESSION_COOKIE, { path: '/' });
  return c.json({ authenticated: false });
});

app.get('/api/overview', async (c) => {
  const [events, talks, leaderboard, sessions] = await Promise.all([
    getAllEvents(),
    getAllTalks(),
    buildLeaderboard(),
    getAllQuizSessions(),
  ]);
  const activeSession = sessions.find((session) => session.status === 'waiting' || session.status === 'active') ?? null;

  return c.json({ events, talks, leaderboard, activeSession });
});

app.get('/api/events', async (c) => {
  return c.json(await getAllEvents());
});

app.post('/api/events', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  const body = await c.req.json();
  const { name, description, event_date } = body;

  if (!name || !event_date) {
    return c.json({ error: 'name and event_date are required' }, 400);
  }

  return c.json(await createEvent({
    name,
    description: description || null,
    event_date,
  }), 201);
});

app.get('/api/events/:eventId', async (c) => {
  const event = await getEventById(c.req.param('eventId'));

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  return c.json(event);
});

app.patch('/api/events/:eventId', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  try {
    return c.json(await updateEvent(c.req.param('eventId'), await c.req.json()));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update event' }, 500);
  }
});

app.get('/api/events/:eventId/talks', async (c) => {
  return c.json(await getTalksByEvent(c.req.param('eventId')));
});

app.get('/api/events/:eventId/speakers', async (c) => {
  return c.json(await getSpeakersByEvent(c.req.param('eventId')));
});

app.post('/api/events/:eventId/speakers', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  const body = await c.req.json();
  const { email, name } = body;

  if (!email || !name) {
    return c.json({ error: 'email and name are required' }, 400);
  }

  try {
    return c.json(await addSpeaker({
      event_id: c.req.param('eventId'),
      email,
      name,
    }), 201);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to add speaker' }, 400);
  }
});

app.delete('/api/events/:eventId/speakers/:speakerId', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  try {
    await removeSpeaker(c.req.param('speakerId'));
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to remove speaker' }, 500);
  }
});

app.post('/api/events/:eventId/validate-speaker', async (c) => {
  const { email } = await c.req.json();

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const speaker = await getSpeakerByEmail(c.req.param('eventId'), String(email).trim());
  return c.json({
    valid: Boolean(speaker),
    speaker: speaker ?? undefined,
  });
});

app.get('/api/talks', async (c) => {
  const eventId = c.req.query('eventId');
  const talks = await getAllTalks();
  return c.json(eventId ? talks.filter((talk) => talk.event_id === eventId) : talks);
});

app.patch('/api/talks/:talkId', async (c) => {
  const body = await c.req.json();
  const updates: Record<string, unknown> = {};

  if (body.status) {
    const adminError = requireAdmin(c);
    if (adminError) return adminError;

    updates.status = body.status;
  }

  if (body.slides_url) {
    try {
      new URL(body.slides_url);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    updates.slides_url = body.slides_url;
    updates.slides_type = 'url';
    updates.storage_path = null;
    updates.slides_uploaded_at = now();
    updates.status = 'slides_received';
  }

  try {
    return c.json(await updateTalk(c.req.param('talkId'), updates));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update talk' }, 500);
  }
});

app.post('/api/talks/:talkId/reminder', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  const talk = await getTalkById(c.req.param('talkId'));

  if (!talk) {
    return c.json({ error: 'Talk not found' }, 404);
  }

  if (talk.status !== 'accepted' || talk.slides_uploaded_at) {
    return c.json({ error: 'Only accepted talks without slides can receive reminders' }, 400);
  }

  return c.json(await updateTalk(talk.id, {
    reminder_sent_count: talk.reminder_sent_count + 1,
    last_reminder_sent_at: now(),
  }));
});

app.get('/api/my-talks', async (c) => {
  const email = c.req.query('email');

  if (!email) {
    return c.json({ error: 'Email parameter required' }, 400);
  }

  const allTalks = await getAllTalks();
  const userTalks = allTalks.filter((talk) => talk.speaker_email.toLowerCase() === email.toLowerCase());
  const talksWithEvents = await Promise.all(
    userTalks.map(async (talk) => ({
      ...talk,
      event: await getEventById(talk.event_id),
    })),
  );

  talksWithEvents.sort((a, b) => {
    if (!a.event || !b.event) return 0;
    return new Date(b.event.event_date).getTime() - new Date(a.event.event_date).getTime();
  });

  return c.json(talksWithEvents);
});

app.post('/api/cfp', async (c) => {
  const body = await c.req.json();
  const { event_id, speaker_name, speaker_email, github_username, title, abstract, bio } = body;

  if (!event_id || !speaker_name || !speaker_email || !title) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const event = await getEventById(event_id);
  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  if (event.status !== 'cfp_open') {
    return c.json({ error: 'CFP is not open for this event' }, 400);
  }

  const speaker = await getSpeakerByEmail(event_id, speaker_email);
  if (!speaker) {
    return c.json({ error: 'Email not on the approved speakers list for this event' }, 403);
  }

  const talk = await createTalk({
    event_id,
    speaker_name,
    speaker_email,
    github_username: github_username || null,
    title,
    topic: body.topic || 'General',
    abstract: abstract || null,
    bio: bio || null,
    slides_url: null,
    slides_type: null,
    storage_path: null,
    slides_uploaded_at: null,
  });

  return c.json(talk, 201);
});

app.get('/api/leaderboard', async (c) => {
  const type = c.req.query('type') ?? 'all-time';
  const sessionId = c.req.query('sessionId');

  if (type === 'per-event' && sessionId) {
    return c.json(await buildSessionLeaderboard(sessionId));
  }

  if (type === 'monthly') {
    return c.json(await buildMonthlyLeaderboard());
  }

  return c.json(await buildLeaderboard());
});

app.get('/api/quiz/active', async (c) => {
  const sessions = await getAllQuizSessions();
  const active = sessions.find((session) => session.status === 'waiting' || session.status === 'active');

  return c.json({
    available: Boolean(active),
    has_active_quiz: Boolean(active),
    session: active ?? null,
  });
});

app.get('/api/quiz/sessions', async (c) => {
  const eventId = c.req.query('eventId');
  return c.json(eventId ? await getQuizSessionsByEvent(eventId) : await getAllQuizSessions());
});

app.post('/api/quiz/sessions', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  const { event_id } = await c.req.json();
  if (!event_id) {
    return c.json({ error: 'event_id is required' }, 400);
  }
  return c.json(await createQuizSession({ event_id }), 201);
});

app.get('/api/quiz/sessions/:sessionId', async (c) => {
  const session = await getQuizSessionById(c.req.param('sessionId'));
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }
  const questions = await getQuestionsBySession(session.id);
  const participants = await getQuizParticipantsBySession(session.id);
  return c.json({
    ...session,
    session,
    questions,
    participantCount: participants.length,
  });
});

app.patch('/api/quiz/sessions/:sessionId', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  try {
    return c.json(await updateQuizSession(c.req.param('sessionId'), await c.req.json()));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update session' }, 500);
  }
});

app.post('/api/quiz/questions', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  const body = await c.req.json();
  const { quiz_session_id, question_text, options, correct_index, order_index, time_limit_seconds, points } = body;

  if (!quiz_session_id || !question_text || !Array.isArray(options) || correct_index === undefined || order_index === undefined) {
    return c.json({ error: 'quiz_session_id, question_text, options, correct_index, and order_index are required' }, 400);
  }

  const validationError = validateQuestionPayload(question_text, options, Number(correct_index));
  if (validationError) {
    return c.json({ error: validationError }, 400);
  }

  return c.json(await createQuestion({
    quiz_session_id,
    question_text: String(question_text).trim(),
    options: options.map((option) => String(option).trim()),
    correct_index: Number(correct_index),
    order_index,
    time_limit_seconds,
    points,
  }), 201);
});

app.post('/api/quiz/sessions/:sessionId/questions/from-paper', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  const session = await getQuizSessionById(c.req.param('sessionId'));
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  if (session.status === 'active' || session.status === 'finished') {
    return c.json({ error: 'Paper questions can only be added before the quiz starts' }, 409);
  }

  let formData: FormData;
  try {
    formData = await c.req.raw.formData();
  } catch {
    return c.json({ error: 'Upload must use multipart/form-data' }, 400);
  }

  const uploadedFile = formData.get('file');
  if (!(uploadedFile instanceof File)) {
    return c.json({ error: 'A PDF file is required' }, 400);
  }

  const fileValidationError = validatePaperQuizFile(uploadedFile);
  if (fileValidationError) {
    return c.json({ error: fileValidationError }, 400);
  }

  const arrayBuffer = await uploadedFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!hasPdfHeader(bytes)) {
    return c.json({ error: 'Uploaded file does not look like a valid PDF' }, 400);
  }

  const requestedQuestionCount = parseRequestedQuestionCount(formData.get('question_count'));
  let extractedText = '';

  try {
    extractedText = await extractTextFromPdf(bytes);
  } catch (error) {
    console.error('PDF extraction failed:', error);
    return c.json({ error: 'Could not extract text from this PDF. Try a text-based, non-password-protected PDF.' }, 422);
  }

  if (extractedText.length < PAPER_QUIZ_MIN_TEXT_CHARS) {
    return c.json({
      error: 'Not enough readable text was found in this PDF. Scanned/image-only PDFs are not supported by this prototype.',
    }, 422);
  }

  const drafts = generateQuestionDraftsFromText(extractedText, requestedQuestionCount);
  if (drafts.length === 0) {
    return c.json({ error: 'Could not identify enough quiz-worthy terms in this PDF. Try a longer paper or add questions manually.' }, 422);
  }

  const existingQuestions = await getQuestionsBySession(session.id);
  const firstOrderIndex = Math.max(-1, ...existingQuestions.map((question) => question.order_index)) + 1;
  const createdQuestions: Question[] = [];

  for (const [index, draft] of drafts.entries()) {
    createdQuestions.push(await createQuestion({
      quiz_session_id: session.id,
      question_text: draft.question_text,
      options: draft.options,
      correct_index: draft.correct_index,
      order_index: firstOrderIndex + index,
      time_limit_seconds: 20,
      points: 1000,
    }));
  }

  const response: GeneratedQuizFromPaperResponse = {
    session_id: session.id,
    questions: createdQuestions,
    summary: {
      source_file_name: uploadedFile.name || 'uploaded.pdf',
      extracted_character_count: extractedText.length,
      requested_question_count: requestedQuestionCount,
      created_question_count: createdQuestions.length,
      generation_note: PAPER_QUIZ_GENERATION_NOTE,
      warnings: createdQuestions.length < requestedQuestionCount
        ? ['Fewer questions were generated than requested because the extracted text had limited distinct quiz terms.']
        : [],
    },
  };

  return c.json(response, 201);
});

app.patch('/api/quiz/questions/:questionId', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  try {
    const questionId = c.req.param('questionId');
    const existingQuestion = await getQuestionById(questionId);
    if (!existingQuestion) {
      return c.json({ error: 'Question not found' }, 404);
    }

    const body = await c.req.json();
    const updates: Partial<Omit<Question, 'id' | 'created_at'>> = {};

    if (body.quiz_session_id !== undefined) updates.quiz_session_id = String(body.quiz_session_id);
    if (body.question_text !== undefined) updates.question_text = String(body.question_text).trim();
    if (body.options !== undefined) {
      if (!Array.isArray(body.options)) {
        return c.json({ error: 'options must be an array of 4 answers' }, 400);
      }
      updates.options = body.options.map((option: unknown) => String(option).trim());
    }
    if (body.correct_index !== undefined) updates.correct_index = Number(body.correct_index);
    if (body.order_index !== undefined) updates.order_index = Number(body.order_index);
    if (body.time_limit_seconds !== undefined) updates.time_limit_seconds = Number(body.time_limit_seconds);
    if (body.points !== undefined) updates.points = Number(body.points);

    if (body.question_text !== undefined || body.options !== undefined || body.correct_index !== undefined) {
      const validationError = validateQuestionPayload(
        updates.question_text ?? existingQuestion.question_text,
        updates.options ?? existingQuestion.options,
        updates.correct_index ?? existingQuestion.correct_index,
      );
      if (validationError) {
        return c.json({ error: validationError }, 400);
      }
    }

    return c.json(await updateQuestion(questionId, updates));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update question' }, 500);
  }
});

app.delete('/api/quiz/questions/:questionId', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  try {
    await deleteQuestion(c.req.param('questionId'));
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Failed to delete question' }, 500);
  }
});

app.post('/api/quiz/questions/reorder', async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;

  const { session_id, question_ids } = await c.req.json();
  if (!session_id || !Array.isArray(question_ids)) {
    return c.json({ error: 'session_id and question_ids are required' }, 400);
  }
  await reorderQuestions(session_id, question_ids);
  return c.json({ ok: true });
});

app.post('/api/quiz/join', async (c) => {
  const body = await c.req.json();
  const { join_code, nickname, device_id } = body;

  if (!join_code || !nickname || !device_id) {
    return c.json({ error: 'join_code, nickname, and device_id are required' }, 400);
  }

  const session = await getQuizSessionByCode(String(join_code).toUpperCase());
  if (!session) {
    return c.json({ error: 'Invalid join code' }, 404);
  }

  if (session.status === 'finished') {
    return c.json({ error: 'This quiz has already finished' }, 400);
  }

  let user = await getUserByDeviceId(device_id);
  if (!user) {
    user = await createUser({ device_id, nickname });
  }

  const existingParticipant = await getQuizParticipantBySessionAndUser(session.id, user.id);
  if (existingParticipant) {
    return c.json({
      session_id: session.id,
      user_id: user.id,
      participant_id: existingParticipant.id,
    });
  }

  const participant = await createQuizParticipant({
    quiz_session_id: session.id,
    user_id: user.id,
    nickname_used: nickname,
  });
  await updateUser(user.id, {
    events_participated: user.events_participated + 1,
  });

  return c.json({
    session_id: session.id,
    user_id: user.id,
    participant_id: participant.id,
  });
});

app.post('/api/quiz/answer', async (c) => {
  const body = await c.req.json();
  const { session_id, user_id, answer_index } = body;

  if (!session_id || !user_id || answer_index === undefined) {
    return c.json({ error: 'session_id, user_id, and answer_index are required' }, 400);
  }

  const session = await getQuizSessionById(session_id);
  if (!session || session.status !== 'active') {
    return c.json({ error: 'Quiz is not active' }, 400);
  }

  if (session.question_phase !== 'answering') {
    return c.json({ error: 'Question is not accepting answers' }, 400);
  }

  const questions = await getQuestionsBySession(session_id);
  const currentQuestion = questions.find((question) => question.order_index === session.current_question_index);

  if (!currentQuestion) {
    return c.json({ error: 'No active question' }, 400);
  }

  const existing = await getResponseByQuestionAndUser(currentQuestion.id, user_id);
  if (existing) {
    return c.json({ error: 'Already answered this question' }, 400);
  }

  const questionStartTime = session.question_started_at ? new Date(session.question_started_at).getTime() : Date.now();
  const timeTakenMs = Date.now() - questionStartTime;
  const timeLimitMs = currentQuestion.time_limit_seconds * 1000;

  if (timeTakenMs > timeLimitMs + 2000) {
    return c.json({ error: 'Answer submitted too late' }, 400);
  }

  const isCorrect = answer_index === currentQuestion.correct_index;
  const basePoints = calculatePoints(currentQuestion.points, timeLimitMs, timeTakenMs, isCorrect);
  const participant = await getQuizParticipantBySessionAndUser(session_id, user_id);

  if (!participant) {
    return c.json({ error: 'Participant not found' }, 400);
  }

  const newStreak = isCorrect ? participant.current_streak + 1 : 0;
  const streakBonus = isCorrect ? calculateStreakBonus(newStreak) : 0;
  const totalPoints = basePoints + streakBonus;

  await createResponse({
    question_id: currentQuestion.id,
    user_id,
    answer_index,
    answered_at: now(),
    time_taken_ms: Math.round(timeTakenMs),
    points_awarded: totalPoints,
    is_correct: isCorrect,
  });

  await updateQuizParticipant(participant.id, {
    total_score: participant.total_score + totalPoints,
    current_streak: newStreak,
  });
  const user = await getUserById(user_id);
  if (user && !user.merged_into_user_id) {
    await updateUser(user.id, {
      total_points: user.total_points + totalPoints,
    });
  }

  return c.json({
    is_correct: isCorrect,
    points_awarded: totalPoints,
    correct_index: currentQuestion.correct_index,
    streak_count: newStreak,
  });
});

app.get('/api/quiz/state', async (c) => {
  const sessionId = c.req.query('sessionId');
  const userId = c.req.query('userId');

  if (!sessionId) {
    return c.json({ error: 'sessionId is required' }, 400);
  }

  let session = await getQuizSessionById(sessionId);
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  if (session.status === 'active' && session.question_phase === 'answering') {
    const questions = await getQuestionsBySession(sessionId);
    const currentQuestion = questions.find((question) => question.order_index === session!.current_question_index);

    if (currentQuestion && session.question_started_at) {
      const elapsed = Date.now() - new Date(session.question_started_at).getTime();
      const timeLimit = currentQuestion.time_limit_seconds * 1000;
      const responses = await getResponsesByQuestion(currentQuestion.id);
      const participants = await getQuizParticipantsBySession(sessionId);
      const allAnswered = responses.length >= participants.length && participants.length > 0;

      if (elapsed >= timeLimit || allAnswered) {
        session = await updateQuizSession(sessionId, {
          question_phase: 'revealing',
          phase_started_at: new Date().toISOString(),
        });
      }
    }
  }

  let currentQuestion = null;
  let questionStartedAt = null;

  if (session.current_question_index >= 0) {
    const questions = await getQuestionsBySession(sessionId);
    const question = questions.find((candidate) => candidate.order_index === session.current_question_index);

    if (question) {
      if (session.question_phase === 'answering') {
        const { correct_index: _correctIndex, ...safeQuestion } = question;
        currentQuestion = safeQuestion;
      } else {
        currentQuestion = question;
      }
      questionStartedAt = session.question_started_at || null;
    }
  }

  const participants = await getQuizParticipantsBySession(sessionId);
  let answersCount = 0;
  let responses: Response[] = [];

  if (currentQuestion) {
    responses = await getResponsesByQuestion(currentQuestion.id);
    answersCount = responses.length;
  }

  const leaderboard = participants
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 10)
    .map((participant, index) => ({
      user_id: participant.user_id,
      nickname: participant.nickname_used,
      total_score: participant.total_score,
      streak_count: participant.current_streak,
      rank: index + 1,
    }));

  const answerDistribution = currentQuestion && (session.question_phase === 'revealing' || session.question_phase === 'scoreboard')
    ? [0, 1, 2, 3].map((optionIndex) => {
      const count = responses.filter((response) => response.answer_index === optionIndex).length;
      return {
        option_index: optionIndex,
        count,
        percentage: responses.length > 0 ? Math.round((count / responses.length) * 100) : 0,
      };
    })
    : undefined;

  let playerResult = undefined;
  if (userId && currentQuestion) {
    const response = await getResponseByQuestionAndUser(currentQuestion.id, userId);
    if (response) {
      const participant = participants.find((candidate) => candidate.user_id === userId);
      const fullQuestion = (await getQuestionsBySession(sessionId)).find((question) => question.id === currentQuestion.id);

      playerResult = {
        is_correct: response.is_correct!,
        points_awarded: response.points_awarded,
        correct_index: fullQuestion?.correct_index ?? 0,
        streak_count: participant?.current_streak || 0,
      };
    }
  }

  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

  const stateResponse: QuizStateResponse = {
    session: {
      id: session.id,
      status: session.status,
      current_question_index: session.current_question_index,
      join_code: session.join_code,
      question_phase: session.question_phase,
    },
    current_question: currentQuestion,
    question_started_at: questionStartedAt,
    participants_count: participants.length,
    answers_count: answersCount,
    leaderboard,
    answer_distribution: answerDistribution,
    player_result: playerResult,
  };

  return c.json(stateResponse);
});

app.post('/api/users/claim', async (c) => {
  const body = await c.req.json();
  const { user_id, device_id, username, email, secret_question, secret_answer } = body;

  if (!user_id || !device_id || !username || !secret_question || !secret_answer) {
    return c.json({ error: 'user_id, device_id, username, secret_question, and secret_answer are required' }, 400);
  }

  const user = await getUserById(user_id);

  if (!user || user.merged_into_user_id) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.is_admin) {
    return c.json({ error: 'Admin users cannot be claimed from this flow' }, 400);
  }

  const trimmedUsername = String(username).trim();
  const trimmedQuestion = String(secret_question).trim();
  const trimmedAnswer = String(secret_answer).trim();
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

  if (!trimmedUsername || !trimmedQuestion || !trimmedAnswer) {
    return c.json({ error: 'username, secret_question, and secret_answer must be non-empty' }, 400);
  }

  if (user.is_claimed && user.device_id && user.device_id !== device_id) {
    return c.json({ error: 'This profile is already claimed on another device' }, 409);
  }

  const existingDeviceUser = await getUserByDeviceId(device_id);
  if (existingDeviceUser && existingDeviceUser.id !== user.id && !existingDeviceUser.merged_into_user_id) {
    return c.json({
      error: 'This device is already linked to another profile. Merge that profile into your claimed one instead.',
      conflict_user_id: existingDeviceUser.id,
    }, 409);
  }

  const updated = await updateUser(user.id, {
    device_id,
    username: trimmedUsername,
    email: normalizedEmail,
    secret_question: trimmedQuestion,
    secret_answer_hash: hashSecretAnswer(trimmedAnswer),
    is_claimed: true,
  });

  return c.json({
    user_id: updated.id,
    username: updated.username,
    email: updated.email,
    is_claimed: updated.is_claimed,
    total_points: updated.total_points,
    events_participated: updated.events_participated,
  });
});

app.post('/api/users/merge', async (c) => {
  const body = await c.req.json();
  const { target_user_id, source_user_id, secret_answer } = body;

  if (!target_user_id || !source_user_id || !secret_answer) {
    return c.json({ error: 'target_user_id, source_user_id, and secret_answer are required' }, 400);
  }

  if (target_user_id === source_user_id) {
    return c.json({ error: 'target_user_id and source_user_id must be different users' }, 400);
  }

  const users = await readData<User>('users');
  const targetIndex = users.findIndex((user) => user.id === target_user_id);
  const sourceIndex = users.findIndex((user) => user.id === source_user_id);

  if (targetIndex === -1 || sourceIndex === -1) {
    return c.json({ error: 'Target or source user not found' }, 404);
  }

  const target = users[targetIndex];
  const source = users[sourceIndex];

  if (!target.is_claimed) {
    return c.json({ error: 'Target account must be claimed before merging' }, 400);
  }

  if (source.merged_into_user_id) {
    return c.json({ error: 'Source account has already been merged' }, 409);
  }

  if (target.merged_into_user_id) {
    return c.json({ error: 'Target account is already merged into another user' }, 409);
  }

  if (source.is_admin || target.is_admin) {
    return c.json({ error: 'Admin users cannot be merged from this flow' }, 400);
  }

  if (!compareSecretAnswer(String(secret_answer), target.secret_answer_hash)) {
    return c.json({ error: 'Secret answer does not match target account' }, 403);
  }

  target.total_points += source.total_points;
  target.events_participated += source.events_participated;
  source.merged_into_user_id = target.id;
  source.total_points = 0;
  source.events_participated = 0;

  await writeData<User>('users', users);
  await mergeParticipantRecords(target, source);
  await mergeResponseRecords(target, source);

  return c.json({
    merged_into_user_id: target.id,
    source_user_id: source.id,
    target_total_points: target.total_points,
    target_events_participated: target.events_participated,
  });
});

app.get('*', (c) => {
  return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://api.fontshare.com" />
    <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" rel="stylesheet" />
    <title>DevCon-Comm</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`);
});

function validatePaperQuizFile(file: File): string | null {
  const isPdfType = file.type === 'application/pdf' || file.type === 'application/x-pdf' || file.type === '';
  const isPdfName = file.name.toLowerCase().endsWith('.pdf');

  if (!isPdfType || !isPdfName) {
    return 'File must be a PDF';
  }

  if (file.size <= 0) {
    return 'Uploaded PDF is empty';
  }

  if (file.size > PAPER_QUIZ_MAX_FILE_SIZE_BYTES) {
    return 'PDF must be 8MB or smaller';
  }

  return null;
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  return bytes.length >= 5
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d;
}

function parseRequestedQuestionCount(value: FormDataEntryValue | null): number {
  const parsed = Number(value ?? PAPER_QUIZ_DEFAULT_QUESTION_COUNT);
  if (!Number.isFinite(parsed)) {
    return PAPER_QUIZ_DEFAULT_QUESTION_COUNT;
  }

  return Math.min(PAPER_QUIZ_MAX_QUESTION_COUNT, Math.max(1, Math.floor(parsed)));
}

async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  const parser = new PDFParse({
    data: bytes,
    useWorkerFetch: false,
    useSystemFonts: true,
    stopAtErrors: false,
  });

  try {
    const result = await parser.getText({
      first: 40,
      pageJoiner: '\n\n',
      parseHyperlinks: false,
    });

    return normalizeExtractedText(result.text).slice(0, PAPER_QUIZ_MAX_TEXT_CHARS);
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/-\s*\n\s*/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

type QuestionDraft = Pick<Question, 'question_text' | 'options' | 'correct_index'>;

function generateQuestionDraftsFromText(text: string, requestedCount: number): QuestionDraft[] {
  const terms = extractTerms(text, 80);
  const sentences = splitCandidateSentences(text)
    .map((sentence) => ({
      sentence,
      score: scoreSentence(sentence),
      terms: extractTerms(sentence, 8),
    }))
    .filter((candidate) => candidate.terms.length > 0)
    .sort((a, b) => b.score - a.score);

  const drafts: QuestionDraft[] = [];
  const usedAnswers = new Set<string>();

  for (const candidate of sentences) {
    if (drafts.length >= requestedCount) {
      break;
    }

    const answer = candidate.terms.find((term) => !usedAnswers.has(normalizeTermKey(term)));
    if (!answer) {
      continue;
    }

    const distractors = terms
      .filter((term) => normalizeTermKey(term) !== normalizeTermKey(answer))
      .filter((term) => !candidate.sentence.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 12);
    const options = pickOptions(answer, distractors);

    if (options.length !== 4) {
      continue;
    }

    const correctIndex = options.findIndex((option) => normalizeTermKey(option) === normalizeTermKey(answer));
    if (correctIndex < 0) {
      continue;
    }

    drafts.push({
      question_text: `Prototype from paper: which term best completes this statement? "${blankSentence(candidate.sentence, answer)}"`,
      options,
      correct_index: correctIndex,
    });
    usedAnswers.add(normalizeTermKey(answer));
  }

  return drafts;
}

function splitCandidateSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 80 && sentence.length <= 280)
    .filter((sentence) => !/^(references|bibliography|appendix|acknowledg)/i.test(sentence))
    .filter((sentence) => !/(https?:\/\/|www\.|@)/i.test(sentence));
}

function scoreSentence(sentence: string): number {
  const terms = extractTerms(sentence, 12);
  let score = terms.length * 3;

  if (/\b(is|are|was|were|means|refers|defines|enables|supports|uses|provides|requires|improves|reduces|increases)\b/i.test(sentence)) {
    score += 8;
  }

  if (/[A-Z]{2,}/.test(sentence)) {
    score += 4;
  }

  if (sentence.length >= 110 && sentence.length <= 220) {
    score += 4;
  }

  if (/\b(table|figure|fig\.|et al\.|copyright|license)\b/i.test(sentence)) {
    score -= 8;
  }

  return score;
}

function extractTerms(text: string, limit: number): string[] {
  const counts = new Map<string, { term: string; count: number; score: number }>();
  const matches = text.match(/\b[A-Za-z][A-Za-z0-9+#./-]{2,}\b/g) ?? [];

  for (const rawTerm of matches) {
    const term = normalizeDisplayTerm(rawTerm);
    const key = normalizeTermKey(term);

    if (!isUsableTerm(term, key)) {
      continue;
    }

    const current = counts.get(key) ?? { term, count: 0, score: termScore(term) };
    current.count += 1;
    current.score += 1;
    counts.set(key, current);
  }

  return [...counts.values()]
    .sort((a, b) => (b.score + b.count) - (a.score + a.count))
    .map((entry) => entry.term)
    .slice(0, limit);
}

function normalizeDisplayTerm(term: string): string {
  return term.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9+#./-]+$/g, '');
}

function normalizeTermKey(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9+#]+/g, '');
}

function isUsableTerm(term: string, key: string): boolean {
  return key.length >= 3
    && key.length <= 28
    && !STOP_WORDS.has(key)
    && !/^\d+$/.test(key)
    && !/^(doi|isbn|http|https|www|com|org|edu|page|pages|figure|table|chapter|section)$/.test(key);
}

function termScore(term: string): number {
  let score = Math.min(term.length, 14);
  if (/[A-Z]/.test(term.slice(1))) score += 4;
  if (/[0-9+#./-]/.test(term)) score += 3;
  if (term.length >= 8) score += 2;
  return score;
}

function pickOptions(answer: string, distractors: string[]): string[] {
  const unique = [answer];
  const seen = new Set([normalizeTermKey(answer)]);

  for (const distractor of distractors) {
    const key = normalizeTermKey(distractor);
    if (!seen.has(key)) {
      unique.push(distractor);
      seen.add(key);
    }

    if (unique.length === 4) {
      break;
    }
  }

  return stableShuffle(unique);
}

function stableShuffle(options: string[]): string[] {
  return [...options].sort((a, b) => hashString(a) - hashString(b));
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function blankSentence(sentence: string, answer: string): string {
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blanked = sentence.replace(new RegExp(`\\b${escaped}\\b`, 'i'), '_____');
  return truncateText(blanked, 210);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function validateQuestionPayload(questionText: unknown, options: unknown[], correctIndex: number): string | null {
  if (!String(questionText ?? '').trim()) {
    return 'Question text is required';
  }

  if (options.length !== 4) {
    return 'Exactly 4 options are required';
  }

  if (options.some((option) => !String(option ?? '').trim())) {
    return 'All options are required';
  }

  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return 'correct_index must be between 0 and 3';
  }

  return null;
}

async function buildLeaderboard(): Promise<(LeaderboardEntry & { events_participated: number; is_claimed: boolean; device_id: string | null })[]> {
  const users = await getAllUsers();

  return users
    .filter((user) => !user.is_admin && !user.merged_into_user_id && user.total_points > 0)
    .sort((a, b) => b.total_points - a.total_points)
    .map((user, index) => ({
      rank: index + 1,
      nickname: user.username || user.nickname || 'Anonymous',
      total_score: user.total_points,
      events_participated: user.events_participated,
      is_claimed: user.is_claimed,
      user_id: user.id,
      device_id: user.device_id,
      streak_count: 0,
    }));
}

async function buildSessionLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
  const participants = await getQuizParticipantsBySession(sessionId);

  return participants
    .sort((a, b) => b.total_score - a.total_score)
    .map((participant, index) => ({
      user_id: participant.user_id,
      nickname: participant.nickname_used,
      total_score: participant.total_score,
      rank: index + 1,
      streak_count: participant.current_streak,
    }));
}

async function buildMonthlyLeaderboard(): Promise<(LeaderboardEntry & { events_participated: number; is_claimed: boolean; device_id: string | null })[]> {
  const [users, responses] = await Promise.all([
    getAllUsers(),
    readData<Response>('responses'),
  ]);
  const userById = new Map(users.map((user) => [user.id, user]));
  const nowDate = new Date();
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
  const totals = new Map<string, number>();

  for (const response of responses) {
    if (new Date(response.created_at).getTime() < monthStart || !response.points_awarded) {
      continue;
    }
    totals.set(response.user_id, (totals.get(response.user_id) ?? 0) + response.points_awarded);
  }

  return [...totals.entries()]
    .map(([userId, score]) => ({ user: userById.get(userId), score }))
    .filter((entry): entry is { user: User; score: number } => Boolean(entry.user && !entry.user.is_admin && !entry.user.merged_into_user_id))
    .sort((a, b) => b.score - a.score)
    .map(({ user, score }, index) => ({
      rank: index + 1,
      nickname: user.username || user.nickname || 'Anonymous',
      total_score: score,
      events_participated: user.events_participated,
      is_claimed: user.is_claimed,
      user_id: user.id,
      device_id: user.device_id,
      streak_count: 0,
    }));
}

async function mergeParticipantRecords(target: User, source: User) {
  const participants = await readData<QuizParticipant>('quiz-participants');
  const participantBySession = new Map<string, QuizParticipant>();
  const participantIndexesToDelete: number[] = [];

  for (const participant of participants) {
    if (participant.user_id === target.id) {
      participantBySession.set(participant.quiz_session_id, participant);
    }
  }

  for (let index = 0; index < participants.length; index += 1) {
    const participant = participants[index];
    if (participant.user_id !== source.id) {
      continue;
    }

    const targetParticipant = participantBySession.get(participant.quiz_session_id);

    if (!targetParticipant) {
      participant.user_id = target.id;
      participantBySession.set(participant.quiz_session_id, participant);
      continue;
    }

    targetParticipant.total_score += participant.total_score;
    targetParticipant.current_streak = Math.max(targetParticipant.current_streak, participant.current_streak);
    participantIndexesToDelete.push(index);
  }

  if (participantIndexesToDelete.length > 0) {
    const removeSet = new Set(participantIndexesToDelete);
    await writeData<QuizParticipant>('quiz-participants', participants.filter((_, index) => !removeSet.has(index)));
    return;
  }

  await writeData<QuizParticipant>('quiz-participants', participants);
}

async function mergeResponseRecords(target: User, source: User) {
  const responses = await readData<Response>('responses');
  for (const response of responses) {
    if (response.user_id === source.id) {
      response.user_id = target.id;
    }
  }
  await writeData<Response>('responses', responses);
}

export default app;
