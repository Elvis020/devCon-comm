import { NextRequest, NextResponse } from 'next/server';
import { getQuizSessionByCode } from '@/lib/mock-db/quiz-sessions';
import { getUserByDeviceId, createUser } from '@/lib/mock-db/users';
import { createQuizParticipant, getQuizParticipantBySessionAndUser } from '@/lib/mock-db/quiz-participants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { join_code, nickname, device_id } = body;

    if (!join_code || !nickname || !device_id) {
      return NextResponse.json(
        { error: 'join_code, nickname, and device_id are required' },
        { status: 400 }
      );
    }

    // Find session by join code
    const session = await getQuizSessionByCode(join_code.toUpperCase());

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 404 }
      );
    }

    if (session.status === 'finished') {
      return NextResponse.json(
        { error: 'This quiz has already finished' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await getUserByDeviceId(device_id);

    if (!user) {
      user = await createUser({
        device_id,
        nickname,
      });
    }

    // Check if already joined
    const existingParticipant = await getQuizParticipantBySessionAndUser(
      session.id,
      user.id
    );

    if (existingParticipant) {
      return NextResponse.json({
        session_id: session.id,
        user_id: user.id,
        participant_id: existingParticipant.id,
      });
    }

    // Create participant
    const participant = await createQuizParticipant({
      quiz_session_id: session.id,
      user_id: user.id,
      nickname_used: nickname,
    });

    return NextResponse.json({
      session_id: session.id,
      user_id: user.id,
      participant_id: participant.id,
    });
  } catch (error) {
    console.error('Error joining quiz:', error);
    return NextResponse.json(
      { error: 'Failed to join quiz' },
      { status: 500 }
    );
  }
}
