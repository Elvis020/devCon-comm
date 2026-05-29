import { NextRequest, NextResponse } from 'next/server';
import { createQuizSession, getQuizSessionsByEvent } from '@/lib/mock-db/quiz-sessions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId query parameter is required' },
        { status: 400 }
      );
    }

    const sessions = await getQuizSessionsByEvent(eventId);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching quiz sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_id } = body;

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id is required' },
        { status: 400 }
      );
    }

    const session = await createQuizSession({ event_id });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz session:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz session' },
      { status: 500 }
    );
  }
}
