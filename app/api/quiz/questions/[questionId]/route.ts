import { NextRequest, NextResponse } from 'next/server';
import { getQuestionById, updateQuestion, deleteQuestion } from '@/lib/mock-db/questions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const body = await request.json();
    const question = await updateQuestion(params.questionId, body);
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    await deleteQuestion(params.questionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
