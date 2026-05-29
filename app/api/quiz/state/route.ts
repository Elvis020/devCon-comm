import { NextRequest, NextResponse } from 'next/server';
import { getQuizSessionById, updateQuizSession } from '@/lib/mock-db/quiz-sessions';
import { getQuestionsBySession } from '@/lib/mock-db/questions';
import { getQuizParticipantsBySession } from '@/lib/mock-db/quiz-participants';
import { getResponsesByQuestion, getResponseByQuestionAndUser } from '@/lib/mock-db/responses';
import { QuizStateResponse } from '@/types';
import { SIMULATED_DELAY_MS, REVEALING_DURATION_MS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get session
    let session = await getQuizSessionById(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // AUTO-ADVANCE LOGIC (server-driven transitions)
    if (session.status === 'active' && session.question_phase === 'answering') {
      // Check if we should auto-transition to revealing
      const questions = await getQuestionsBySession(sessionId);
      const currentQ = questions.find(q => q.order_index === session.current_question_index);

      if (currentQ && session.question_started_at) {
        const elapsed = Date.now() - new Date(session.question_started_at).getTime();
        const timeLimit = currentQ.time_limit_seconds * 1000;

        // Get answer count
        const responses = await getResponsesByQuestion(currentQ.id);
        const participants = await getQuizParticipantsBySession(sessionId);
        const allAnswered = responses.length >= participants.length && participants.length > 0;

        // Auto-transition to revealing if time expired OR all answered
        if (elapsed >= timeLimit || allAnswered) {
          session = await updateQuizSession(sessionId, {
            question_phase: 'revealing',
            phase_started_at: new Date().toISOString(),
          });
        }
      }
    }

    // Get current question (if active)
    let currentQuestion = null;
    let questionStartedAt = null;

    if (session.current_question_index >= 0) {
      const questions = await getQuestionsBySession(sessionId);
      const q = questions.find(
        question => question.order_index === session.current_question_index
      );

      if (q) {
        // Remove correct_index from player view (unless in revealing/scoreboard phase)
        if (session.question_phase === 'answering') {
          const { correct_index, ...safeQuestion } = q;
          currentQuestion = safeQuestion as any;
        } else {
          // In revealing/scoreboard - show full question
          currentQuestion = q;
        }
        questionStartedAt = session.question_started_at || null;
      }
    }

    // Get participants
    const participants = await getQuizParticipantsBySession(sessionId);

    // Count answers for current question
    let answersCount = 0;
    let responses: any[] = [];
    if (currentQuestion) {
      responses = await getResponsesByQuestion(currentQuestion.id);
      answersCount = responses.length;
    }

    // Build leaderboard (sorted by score, include streak)
    const leaderboard = participants
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 10)
      .map((p, index) => ({
        user_id: p.user_id,
        nickname: p.nickname_used,
        total_score: p.total_score,
        streak_count: p.current_streak,
        rank: index + 1,
      }));

    // Calculate answer distribution (only in revealing/scoreboard phases)
    let answerDistribution = undefined;
    if (currentQuestion && (session.question_phase === 'revealing' || session.question_phase === 'scoreboard')) {
      const totalResponses = responses.length;
      const distribution = [0, 1, 2, 3].map(optIndex => {
        const count = responses.filter(r => r.answer_index === optIndex).length;
        return {
          option_index: optIndex,
          count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        };
      });
      answerDistribution = distribution;
    }

    // Check if player already answered
    let playerResult = undefined;
    if (userId && currentQuestion) {
      const response = await getResponseByQuestionAndUser(
        currentQuestion.id,
        userId
      );

      if (response) {
        // Player has answered - get their streak
        const participant = participants.find(p => p.user_id === userId);

        playerResult = {
          is_correct: response.is_correct!,
          points_awarded: response.points_awarded,
          correct_index: (currentQuestion as any).correct_index || response.is_correct ?
            (await getQuestionsBySession(sessionId)).find(q => q.id === currentQuestion!.id)!.correct_index : 0,
          streak_count: participant?.current_streak || 0,
        };
      }
    }

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY_MS));

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

    return NextResponse.json(stateResponse);
  } catch (error) {
    console.error('Error fetching quiz state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz state' },
      { status: 500 }
    );
  }
}
