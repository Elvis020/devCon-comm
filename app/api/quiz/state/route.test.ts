import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

vi.mock('@/lib/constants', () => ({
  SIMULATED_DELAY_MS: 0,
  REVEALING_DURATION_MS: 5000,
}));

vi.mock('@/lib/mock-db/quiz-sessions', () => ({
  getQuizSessionById: vi.fn(),
  updateQuizSession: vi.fn(),
}));

vi.mock('@/lib/mock-db/questions', () => ({
  getQuestionsBySession: vi.fn(),
}));

vi.mock('@/lib/mock-db/quiz-participants', () => ({
  getQuizParticipantsBySession: vi.fn(),
}));

vi.mock('@/lib/mock-db/responses', () => ({
  getResponsesByQuestion: vi.fn(),
  getResponseByQuestionAndUser: vi.fn(),
}));

import { GET } from '@/app/api/quiz/state/route';
import { getQuizSessionById, updateQuizSession } from '@/lib/mock-db/quiz-sessions';
import { getQuestionsBySession } from '@/lib/mock-db/questions';
import { getQuizParticipantsBySession } from '@/lib/mock-db/quiz-participants';
import { getResponsesByQuestion, getResponseByQuestionAndUser } from '@/lib/mock-db/responses';

describe('GET /api/quiz/state auto-transition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions from answering to revealing when question time expires', async () => {
    vi.mocked(getQuizSessionById).mockResolvedValue({
      id: 's1',
      event_id: 'e1',
      join_code: 'ABC123',
      host_user_id: 'host-1',
      status: 'active',
      current_question_index: 0,
      question_phase: 'answering',
      question_started_at: new Date(Date.now() - 21000).toISOString(),
      phase_started_at: null,
      created_at: new Date().toISOString(),
    });

    vi.mocked(getQuestionsBySession).mockResolvedValue([
      {
        id: 'q1',
        quiz_session_id: 's1',
        question_text: '2+2?',
        option_a: '1',
        option_b: '2',
        option_c: '3',
        option_d: '4',
        correct_index: 3,
        points: 1000,
        time_limit_seconds: 20,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
    ]);

    vi.mocked(getQuizParticipantsBySession).mockResolvedValue([
      {
        id: 'p1',
        quiz_session_id: 's1',
        user_id: 'u1',
        nickname_used: 'A',
        total_score: 0,
        current_streak: 0,
        joined_at: new Date().toISOString(),
      },
    ]);

    vi.mocked(getResponsesByQuestion).mockResolvedValue([]);
    vi.mocked(getResponseByQuestionAndUser).mockResolvedValue(null);

    vi.mocked(updateQuizSession).mockResolvedValue({
      id: 's1',
      event_id: 'e1',
      join_code: 'ABC123',
      host_user_id: 'host-1',
      status: 'active',
      current_question_index: 0,
      question_phase: 'revealing',
      question_started_at: new Date(Date.now() - 21000).toISOString(),
      phase_started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    const req = {
      nextUrl: new URL('http://localhost/api/quiz/state?sessionId=s1'),
    } as any;
    const res = await GET(req);
    const body = await res.json();

    expect(updateQuizSession).toHaveBeenCalledTimes(1);
    expect(updateQuizSession).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ question_phase: 'revealing' })
    );
    expect(body.session.question_phase).toBe('revealing');
  });

  it('does not transition when still within time and not all answered', async () => {
    vi.mocked(getQuizSessionById).mockResolvedValue({
      id: 's2',
      event_id: 'e1',
      join_code: 'DEF456',
      host_user_id: 'host-1',
      status: 'active',
      current_question_index: 0,
      question_phase: 'answering',
      question_started_at: new Date(Date.now() - 5000).toISOString(),
      phase_started_at: null,
      created_at: new Date().toISOString(),
    });

    vi.mocked(getQuestionsBySession).mockResolvedValue([
      {
        id: 'q2',
        quiz_session_id: 's2',
        question_text: '3+3?',
        option_a: '4',
        option_b: '5',
        option_c: '6',
        option_d: '7',
        correct_index: 2,
        points: 1000,
        time_limit_seconds: 20,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
    ]);

    vi.mocked(getQuizParticipantsBySession).mockResolvedValue([
      {
        id: 'p1',
        quiz_session_id: 's2',
        user_id: 'u1',
        nickname_used: 'A',
        total_score: 0,
        current_streak: 0,
        joined_at: new Date().toISOString(),
      },
      {
        id: 'p2',
        quiz_session_id: 's2',
        user_id: 'u2',
        nickname_used: 'B',
        total_score: 0,
        current_streak: 0,
        joined_at: new Date().toISOString(),
      },
    ]);

    vi.mocked(getResponsesByQuestion).mockResolvedValue([
      {
        id: 'r1',
        question_id: 'q2',
        user_id: 'u1',
        answer_index: 2,
        answered_at: new Date().toISOString(),
        time_taken_ms: 1000,
        points_awarded: 950,
        is_correct: true,
      },
    ]);
    vi.mocked(getResponseByQuestionAndUser).mockResolvedValue(null);

    const req = {
      nextUrl: new URL('http://localhost/api/quiz/state?sessionId=s2'),
    } as any;
    const res = await GET(req);
    const body = await res.json();

    expect(updateQuizSession).not.toHaveBeenCalled();
    expect(body.session.question_phase).toBe('answering');
  });
});
