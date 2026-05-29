import { NextRequest, NextResponse } from 'next/server';
import { createTalk } from '@/lib/mock-db/talks';
import { getEventById } from '@/lib/mock-db/events';
import { getSpeakerByEmail } from '@/lib/mock-db/speakers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_id,
      speaker_name,
      speaker_email,
      github_username,
      title,
      abstract,
      bio,
    } = body;

    // Validate required fields
    if (!event_id || !speaker_name || !speaker_email || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify event exists and CFP is open
    const event = await getEventById(event_id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status !== 'cfp_open') {
      return NextResponse.json(
        { error: 'CFP is not open for this event' },
        { status: 400 }
      );
    }

    // Validate speaker email
    const speaker = await getSpeakerByEmail(event_id, speaker_email);
    if (!speaker) {
      return NextResponse.json(
        { error: 'Email not on the approved speakers list for this event' },
        { status: 403 }
      );
    }

    const talk = await createTalk({
      event_id,
      speaker_name,
      speaker_email,
      github_username: github_username || null,
      title,
      abstract: abstract || null,
      bio: bio || null,
      slides_url: null,
      slides_type: null,
      storage_path: null,
      slides_uploaded_at: null,
    });

    return NextResponse.json(talk, { status: 201 });
  } catch (error) {
    console.error('Error submitting CFP:', error);
    return NextResponse.json(
      { error: 'Failed to submit CFP' },
      { status: 500 }
    );
  }
}
