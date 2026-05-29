import { NextRequest, NextResponse } from 'next/server';
import { getTalkById, updateTalk } from '@/lib/mock-db/talks';
import { now } from '@/lib/utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { talkId: string } }
) {
  try {
    const body = await request.json();
    const { status, slides_url } = body;

    const updates: any = {};

    // Handle status change
    if (status) {
      updates.status = status;
    }

    // Handle slide URL upload
    if (slides_url) {
      // Validate URL format
      try {
        new URL(slides_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }

      updates.slides_url = slides_url;
      updates.slides_type = 'url';
      updates.storage_path = null;
      updates.slides_uploaded_at = now();
      updates.status = 'slides_received';
    }

    const talk = await updateTalk(params.talkId, updates);
    return NextResponse.json(talk);
  } catch (error) {
    console.error('Error updating talk:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update talk' },
      { status: 500 }
    );
  }
}
