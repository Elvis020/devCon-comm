import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/mock-db/users';
import { getQuizParticipantsBySession } from '@/lib/mock-db/quiz-participants';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'all-time';
    const eventId = request.nextUrl.searchParams.get('eventId');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (type === 'per-event' && sessionId) {
      // Get leaderboard for specific quiz session
      const participants = await getQuizParticipantsBySession(sessionId);

      const leaderboard = participants
        .sort((a, b) => b.total_score - a.total_score)
        .map((p, index) => ({
          rank: index + 1,
          nickname: p.nickname_used,
          total_score: p.total_score,
          user_id: p.user_id,
        }));

      return NextResponse.json(leaderboard);
    }

    // All-time leaderboard
    const users = await getAllUsers();

    const leaderboard = users
      .filter(u => !u.is_admin && !u.merged_into_user_id && u.total_points > 0)
      .sort((a, b) => b.total_points - a.total_points)
      .map((u, index) => ({
        rank: index + 1,
        nickname: u.username || u.nickname || 'Anonymous',
        total_score: u.total_points,
        events_participated: u.events_participated,
        is_claimed: u.is_claimed,
        user_id: u.id,
        device_id: u.device_id,
      }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
