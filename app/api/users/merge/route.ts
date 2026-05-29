import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/mock-db';
import { compareSecretAnswer } from '@/lib/account-claim';
import type { QuizParticipant, Response, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target_user_id, source_user_id, secret_answer } = body;

    if (!target_user_id || !source_user_id || !secret_answer) {
      return NextResponse.json(
        { error: 'target_user_id, source_user_id, and secret_answer are required' },
        { status: 400 }
      );
    }

    if (target_user_id === source_user_id) {
      return NextResponse.json(
        { error: 'target_user_id and source_user_id must be different users' },
        { status: 400 }
      );
    }

    const users = await readData<User>('users');
    const targetIndex = users.findIndex(user => user.id === target_user_id);
    const sourceIndex = users.findIndex(user => user.id === source_user_id);

    if (targetIndex === -1 || sourceIndex === -1) {
      return NextResponse.json(
        { error: 'Target or source user not found' },
        { status: 404 }
      );
    }

    const target = users[targetIndex];
    const source = users[sourceIndex];

    if (!target.is_claimed) {
      return NextResponse.json(
        { error: 'Target account must be claimed before merging' },
        { status: 400 }
      );
    }

    if (source.merged_into_user_id) {
      return NextResponse.json(
        { error: 'Source account has already been merged' },
        { status: 409 }
      );
    }

    if (target.merged_into_user_id) {
      return NextResponse.json(
        { error: 'Target account is already merged into another user' },
        { status: 409 }
      );
    }

    if (source.is_admin || target.is_admin) {
      return NextResponse.json(
        { error: 'Admin users cannot be merged from this flow' },
        { status: 400 }
      );
    }

    if (!compareSecretAnswer(String(secret_answer), target.secret_answer_hash)) {
      return NextResponse.json(
        { error: 'Secret answer does not match target account' },
        { status: 403 }
      );
    }

    target.total_points += source.total_points;
    target.events_participated += source.events_participated;

    source.merged_into_user_id = target.id;
    source.total_points = 0;
    source.events_participated = 0;

    await writeData<User>('users', users);

    const participants = await readData<QuizParticipant>('quiz-participants');
    const participantBySession = new Map<string, QuizParticipant>();
    const participantIndexesToDelete: number[] = [];

    for (const participant of participants) {
      if (participant.user_id === target.id) {
        participantBySession.set(participant.quiz_session_id, participant);
      }
    }

    for (let i = 0; i < participants.length; i += 1) {
      const participant = participants[i];
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
      participantIndexesToDelete.push(i);
    }

    if (participantIndexesToDelete.length > 0) {
      const removeSet = new Set(participantIndexesToDelete);
      const deduped = participants.filter((_, index) => !removeSet.has(index));
      await writeData<QuizParticipant>('quiz-participants', deduped);
    } else {
      await writeData<QuizParticipant>('quiz-participants', participants);
    }

    const responses = await readData<Response>('responses');
    for (const response of responses) {
      if (response.user_id === source.id) {
        response.user_id = target.id;
      }
    }
    await writeData<Response>('responses', responses);

    return NextResponse.json({
      merged_into_user_id: target.id,
      source_user_id: source.id,
      target_total_points: target.total_points,
      target_events_participated: target.events_participated,
    });
  } catch (error) {
    console.error('Error merging user profiles:', error);
    return NextResponse.json(
      { error: 'Failed to merge profiles' },
      { status: 500 }
    );
  }
}
