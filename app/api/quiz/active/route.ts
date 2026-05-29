import { NextResponse } from 'next/server';
import { getAllQuizSessions } from '@/lib/mock-db/quiz-sessions';

export async function GET() {
  try {
    const sessions = await getAllQuizSessions();

    // Check if there's any session in 'waiting' or 'active' state
    const hasActiveQuiz = sessions.some(
      (session) => session.status === 'waiting' || session.status === 'active'
    );

    return NextResponse.json({
      available: hasActiveQuiz,
      message: hasActiveQuiz ? 'Quiz is available' : 'No active quiz sessions'
    });
  } catch (error) {
    console.error('Error checking quiz availability:', error);
    return NextResponse.json(
      { available: false, error: 'Failed to check quiz availability' },
      { status: 500 }
    );
  }
}
