import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith('image/')) {
    return NextResponse.json({ success: false, message: 'Please upload a valid image file.' }, { status: 400 });
  }

  const directory = path.join(process.cwd(), 'public', 'uploads', 'questions');
  await mkdir(directory, { recursive: true });
  const originalName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}_${originalName}`;
  await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ success: true, imageUrl: `/uploads/questions/${fileName}` });
}