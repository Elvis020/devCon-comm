import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserByDeviceId, updateUser } from '@/lib/mock-db/users';
import { hashSecretAnswer } from '@/lib/account-claim';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, device_id, username, email, secret_question, secret_answer } = body;

    if (!user_id || !device_id || !username || !secret_question || !secret_answer) {
      return NextResponse.json(
        { error: 'user_id, device_id, username, secret_question, and secret_answer are required' },
        { status: 400 }
      );
    }

    const user = await getUserById(user_id);

    if (!user || user.merged_into_user_id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.is_admin) {
      return NextResponse.json(
        { error: 'Admin users cannot be claimed from this flow' },
        { status: 400 }
      );
    }

    const trimmedUsername = String(username).trim();
    const trimmedQuestion = String(secret_question).trim();
    const trimmedAnswer = String(secret_answer).trim();
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

    if (!trimmedUsername || !trimmedQuestion || !trimmedAnswer) {
      return NextResponse.json(
        { error: 'username, secret_question, and secret_answer must be non-empty' },
        { status: 400 }
      );
    }

    if (user.is_claimed && user.device_id && user.device_id !== device_id) {
      return NextResponse.json(
        { error: 'This profile is already claimed on another device' },
        { status: 409 }
      );
    }

    const existingDeviceUser = await getUserByDeviceId(device_id);
    if (existingDeviceUser && existingDeviceUser.id !== user.id && !existingDeviceUser.merged_into_user_id) {
      return NextResponse.json(
        {
          error: 'This device is already linked to another profile. Merge that profile into your claimed one instead.',
          conflict_user_id: existingDeviceUser.id,
        },
        { status: 409 }
      );
    }

    const updated = await updateUser(user.id, {
      device_id,
      username: trimmedUsername,
      email: normalizedEmail,
      secret_question: trimmedQuestion,
      secret_answer_hash: hashSecretAnswer(trimmedAnswer),
      is_claimed: true,
    });

    return NextResponse.json({
      user_id: updated.id,
      username: updated.username,
      email: updated.email,
      is_claimed: updated.is_claimed,
      total_points: updated.total_points,
      events_participated: updated.events_participated,
    });
  } catch (error) {
    console.error('Error claiming user profile:', error);
    return NextResponse.json(
      { error: 'Failed to claim profile' },
      { status: 500 }
    );
  }
}
