import { NextRequest, NextResponse } from 'next/server';
import { getSpeakersByEvent, addSpeaker } from '@/lib/mock-db/speakers';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const speakers = await getSpeakersByEvent(params.eventId);
    return NextResponse.json(speakers);
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch speakers' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const newSpeaker = await addSpeaker({
      event_id: params.eventId,
      email: email.trim(),
      name: name.trim(),
    });

    return NextResponse.json(newSpeaker, { status: 201 });
  } catch (error: any) {
    console.error('Error adding speaker:', error);

    // Check if it's a duplicate speaker error
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add speaker' },
      { status: 500 }
    );
  }
}
