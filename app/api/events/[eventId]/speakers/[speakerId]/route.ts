import { NextRequest, NextResponse } from 'next/server';
import { removeSpeaker } from '@/lib/mock-db/speakers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; speakerId: string } }
) {
  try {
    await removeSpeaker(params.speakerId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing speaker:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Speaker not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to remove speaker' },
      { status: 500 }
    );
  }
}
