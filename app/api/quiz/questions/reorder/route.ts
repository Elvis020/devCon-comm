import { NextRequest, NextResponse } from 'next/server';
import { reorderQuestions } from '@/lib/mock-db/questions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, question_ids } = body;

    if (!session_id || !Array.isArray(question_ids)) {
      return NextResponse.json(
        { error: 'session_id and question_ids array are required' },
        { status: 400 }
      );
    }

    await reorderQuestions(session_id, question_ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering questions:', error);
    return NextResponse.json(
      { error: 'Failed to reorder questions' },
      { status: 500 }
    );
  }
}
