import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Question, QuizParticipant, QuizSession, Response } from '@/types';

const getQuizSessionById = vi.fn();
const updateQuizSession = vi.fn();
const getQuestionsBySession = vi.fn();
const getResponsesByQuestion = vi.fn();
const getQuizParticipantsBySession = vi.fn();
const getResponseByQuestionAndUser = vi.fn();

vi.mock('@/lib/mock-db/quiz-sessions', () => ({
  getQuizSessionById,
  updateQuizSession,
}));

vi.mock('@/lib/mock-db/questions', () => ({
  getQuestionsBySession,
}));

vi.mock('@/lib/mock-db/responses', () => ({
  getResponsesByQuestion,
  getResponseByQuestionAndUser,
}));

vi.mock('@/lib/mock-db/quiz-participants', () => ({
  getQuizParticipantsBySession,
}));

const activeSession: QuizSession = {
  id: 'session-1',
  event_id: 'event-1',
  join_code: 'ABC123',
  status: 'active',
  current_question_index: 0,
  question_phase: 'answering',
  started_at: '2026-06-15T10:00:00.000Z',
  finished_at: null,
  created_at: '2026-06-15T09:00:00.000Z',
  question_started_at: '2026-06-15T10:00:00.000Z',
  phase_started_at: '2026-06-15T10:00:00.000Z',
};

const question: Question = {
  id: 'question-1',
  quiz_session_id: 'session-1',
  question_text: 'What is the answer?',
  options: ['A', 'B', 'C', 'D'],
  correct_index: 2,
  time_limit_seconds: 20,
  points: 1000,
  order_index: 0,
  created_at: '2026-06-15T09:01:00.000Z',
};

const participant: QuizParticipant = {
  id: 'participant-1',
  quiz_session_id: 'session-1',
  user_id: 'user-1',
  nickname_used: 'Ada',
  total_score: 500,
  current_streak: 1,
  joined_at: '2026-06-15T09:59:00.000Z',
};

const response: Response = {
  id: 'response-1',
  question_id: 'question-1',
  user_id: 'user-1',
  answer_index: 2,
  answered_at: '2026-06-15T10:00:05.000Z',
  time_taken_ms: 5000,
  points_awarded: 500,
  is_correct: true,
  created_at: '2026-06-15T10:00:05.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T10:00:25.000Z'));
  getQuizSessionById.mockResolvedValue(activeSession);
  getQuestionsBySession.mockResolvedValue([question]);
  getResponsesByQuestion.mockResolvedValue([]);
  getQuizParticipantsBySession.mockResolvedValue([participant]);
  getResponseByQuestionAndUser.mockResolvedValue(null);
  updateQuizSession.mockImplementation(async (_id, updates) => ({ ...activeSession, ...updates }));
});

describe('quiz state helpers', () => {
  it('advances an active answering session after the time limit expires', async () => {
    const { advanceQuizSessionState } = await import('./quiz-state');

    const result = await advanceQuizSessionState('session-1');

    expect(result.advanced).toBe(true);
    expect(updateQuizSession).toHaveBeenCalledWith('session-1', expect.objectContaining({ question_phase: 'revealing' }));
  });

  it('builds read-only quiz state without exposing the correct index in current_question', async () => {
    const { buildQuizStateResponse } = await import('./quiz-state');
    getResponsesByQuestion.mockResolvedValue([response]);
    getResponseByQuestionAndUser.mockResolvedValue(response);

    const state = await buildQuizStateResponse('session-1', 'user-1');

    expect(updateQuizSession).not.toHaveBeenCalled();
    expect(state?.current_question).toEqual(expect.not.objectContaining({ correct_index: expect.any(Number) }));
    expect(state?.player_result).toMatchObject({ is_correct: true, correct_index: 2, points_awarded: 500 });
    expect(state?.participants_count).toBe(1);
    expect(state?.answers_count).toBe(1);
  });
});
