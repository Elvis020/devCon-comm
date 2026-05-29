import { NextRequest, NextResponse } from 'next/server';
import { getAllTalks } from '@/lib/mock-db/talks';
import { getEventById } from '@/lib/mock-db/events';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const allTalks = await getAllTalks();

    // Filter talks by speaker email
    const userTalks = allTalks.filter(
      talk => talk.speaker_email.toLowerCase() === email.toLowerCase()
    );

    // Fetch event details for each talk
    const talksWithEvents = await Promise.all(
      userTalks.map(async (talk) => {
        const event = await getEventById(talk.event_id);
        return {
          ...talk,
          event,
        };
      })
    );

    // Sort by event date (most recent first)
    talksWithEvents.sort((a, b) =>
      new Date(b.event.event_date).getTime() - new Date(a.event.event_date).getTime()
    );

    return NextResponse.json(talksWithEvents);
  } catch (error) {
    console.error('Error fetching user talks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch talks' },
      { status: 500 }
    );
  }
}
