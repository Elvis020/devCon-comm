import { NextRequest, NextResponse } from 'next/server';
import { getSpeakerByEmail } from '@/lib/mock-db/speakers';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const speaker = await getSpeakerByEmail(params.eventId, email.trim());

    return NextResponse.json({
      valid: !!speaker,
      speaker: speaker || undefined,
    });
  } catch (error) {
    console.error('Error validating speaker:', error);
    return NextResponse.json(
      { error: 'Failed to validate speaker' },
      { status: 500 }
    );
  }
}
