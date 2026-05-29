import { NextRequest, NextResponse } from 'next/server';
import { getQuizSessionById, updateQuizSession } from '@/lib/mock-db/quiz-sessions';
import { getQuestionsBySession } from '@/lib/mock-db/questions';
import { getQuizParticipantsBySession } from '@/lib/mock-db/quiz-participants';
import { getResponsesByQuestion } from '@/lib/mock-db/responses';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getQuizSessionById(params.sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Quiz session not found' },
        { status: 404 }
      );
    }

    const questions = await getQuestionsBySession(params.sessionId);
    const participants = await getQuizParticipantsBySession(params.sessionId);

    // Get answer count for current question
    let answerCount = 0;
    if (session.current_question_index >= 0) {
      const currentQ = questions.find(q => q.order_index === session.current_question_index);
      if (currentQ) {
        const responses = await getResponsesByQuestion(currentQ.id);
        answerCount = responses.length;
      }
    }

    return NextResponse.json({
      ...session,
      questions,
      participantCount: participants.length,
      answerCount
    });
  } catch (error) {
    console.error('Error fetching quiz session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const body = await request.json();
    const session = await updateQuizSession(params.sessionId, body);
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating quiz session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update quiz session' },
      { status: 500 }
    );
  }
}
