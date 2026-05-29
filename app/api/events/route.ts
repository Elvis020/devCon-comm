import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, createEvent } from '@/lib/mock-db/events';
import { EventStatus } from '@/types';

export async function GET() {
  try {
    const events = await getAllEvents();
    // Sort by date descending (newest first)
    events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, event_date } = body;

    if (!name || !event_date) {
      return NextResponse.json(
        { error: 'Name and event_date are required' },
        { status: 400 }
      );
    }

    const event = await createEvent({
      name,
      description: description || null,
      event_date,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
