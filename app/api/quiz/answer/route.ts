import { NextRequest, NextResponse } from 'next/server';
import { getQuizSessionById } from '@/lib/mock-db/quiz-sessions';
import { getQuestionsBySession } from '@/lib/mock-db/questions';
import { createResponse, getResponseByQuestionAndUser } from '@/lib/mock-db/responses';
import { getQuizParticipantBySessionAndUser, updateQuizParticipant } from '@/lib/mock-db/quiz-participants';
import { calculatePoints, calculateStreakBonus } from '@/lib/scoring';
import { now } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, user_id, answer_index } = body;

    if (!session_id || !user_id || answer_index === undefined) {
      return NextResponse.json(
        { error: 'session_id, user_id, and answer_index are required' },
        { status: 400 }
      );
    }

    // Get session
    const session = await getQuizSessionById(session_id);

    if (!session || session.status !== 'active') {
      return NextResponse.json(
        { error: 'Quiz is not active' },
        { status: 400 }
      );
    }

    // Validate phase - only accept answers during "answering" phase
    if (session.question_phase !== 'answering') {
      return NextResponse.json(
        { error: 'Question is not accepting answers' },
        { status: 400 }
      );
    }

    // Get current question
    const questions = await getQuestionsBySession(session_id);
    const currentQuestion = questions.find(
      q => q.order_index === session.current_question_index
    );

    if (!currentQuestion) {
      return NextResponse.json(
        { error: 'No active question' },
        { status: 400 }
      );
    }

    // Check if already answered
    const existing = await getResponseByQuestionAndUser(
      currentQuestion.id,
      user_id
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Already answered this question' },
        { status: 400 }
      );
    }

    // Calculate time taken
    const questionStartTime = session.question_started_at
      ? new Date(session.question_started_at).getTime()
      : Date.now();
    const timeTakenMs = Date.now() - questionStartTime;
    const timeLimitMs = currentQuestion.time_limit_seconds * 1000;

    // Reject late answers (2 second buffer after timer)
    if (timeTakenMs > timeLimitMs + 2000) {
      return NextResponse.json(
        { error: 'Answer submitted too late' },
        { status: 400 }
      );
    }

    // Check correctness
    const isCorrect = answer_index === currentQuestion.correct_index;

    // Calculate base points
    const basePoints = calculatePoints(
      currentQuestion.points,
      timeLimitMs,
      timeTakenMs,
      isCorrect
    );

    // Get participant for streak tracking
    const participant = await getQuizParticipantBySessionAndUser(
      session_id,
      user_id
    );

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 400 }
      );
    }

    // Update streak
    let newStreak = participant.current_streak;
    if (isCorrect) {
      newStreak = participant.current_streak + 1;
    } else {
      newStreak = 0; // Reset streak on wrong answer
    }

    // Calculate streak bonus
    const streakBonus = isCorrect ? calculateStreakBonus(newStreak) : 0;
    const totalPoints = basePoints + streakBonus;

    // Create response
    const response = await createResponse({
      question_id: currentQuestion.id,
      user_id,
      answer_index,
      answered_at: now(),
      time_taken_ms: Math.round(timeTakenMs),
      points_awarded: totalPoints,
      is_correct: isCorrect,
    });

    // Update participant: score + streak
    await updateQuizParticipant(participant.id, {
      total_score: participant.total_score + totalPoints,
      current_streak: newStreak,
    });

    return NextResponse.json({
      is_correct: isCorrect,
      points_awarded: totalPoints,
      correct_index: currentQuestion.correct_index,
      streak_count: newStreak,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
