import { NextRequest, NextResponse } from 'next/server';
import { createQuestion } from '@/lib/mock-db/questions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      quiz_session_id,
      question_text,
      options,
      correct_index,
      time_limit_seconds,
      points,
      order_index,
    } = body;

    if (!quiz_session_id || !question_text || !options || correct_index === undefined || order_index === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json(
        { error: 'Options must be an array of exactly 4 items' },
        { status: 400 }
      );
    }

    if (correct_index < 0 || correct_index > 3) {
      return NextResponse.json(
        { error: 'correct_index must be between 0 and 3' },
        { status: 400 }
      );
    }

    const question = await createQuestion({
      quiz_session_id,
      question_text,
      options,
      correct_index,
      time_limit_seconds,
      points,
      order_index,
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
