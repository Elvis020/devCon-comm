import { NextRequest, NextResponse } from 'next/server';
import { getEventById, updateEvent } from '@/lib/mock-db/events';
import { getTalksByEvent } from '@/lib/mock-db/talks';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await getEventById(params.eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Include talks for this event
    const talks = await getTalksByEvent(params.eventId);

    return NextResponse.json({ ...event, talks });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json();
    const event = await updateEvent(params.eventId, body);
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update event' },
      { status: 500 }
    );
  }
}
