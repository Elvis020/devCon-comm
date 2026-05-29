import { NextRequest, NextResponse } from 'next/server';
import { getTalkById, updateTalk } from '@/lib/mock-db/talks';
import { now } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'slides');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export async function POST(
  request: NextRequest,
  { params }: { params: { talkId: string } }
) {
  try {
    // Verify talk exists and is in correct status
    const talk = await getTalkById(params.talkId);
    if (!talk) {
      return NextResponse.json(
        { error: 'Talk not found' },
        { status: 404 }
      );
    }

    if (talk.status !== 'accepted' && talk.status !== 'slides_received') {
      return NextResponse.json(
        { error: 'Talk must be accepted before uploading slides' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File must be PDF, PPT, or PPTX' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must not exceed 50MB' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate filename with timestamp
    const extension = file.name.split('.').pop();
    const timestamp = Date.now();
    const filename = `${params.talkId}-${timestamp}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Update talk record
    const storagePath = `/uploads/slides/${filename}`;
    const updatedTalk = await updateTalk(params.talkId, {
      slides_type: 'file',
      slides_url: null,
      storage_path: storagePath,
      slides_uploaded_at: now(),
      status: 'slides_received',
    });

    return NextResponse.json({
      success: true,
      talk: updatedTalk,
      path: storagePath,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
