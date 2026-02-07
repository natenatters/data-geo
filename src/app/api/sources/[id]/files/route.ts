import { NextRequest, NextResponse } from 'next/server';
import { getSource, addFile } from '@/lib/store';
import path from 'path';
import fs from 'fs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const source = getSource(id);
  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const filetype = (formData.get('filetype') as string) || 'other';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const dataDir = path.join(process.cwd(), 'data', String(id));
  fs.mkdirSync(dataDir, { recursive: true });

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filepath = path.join(String(id), filename);
  const fullPath = path.join(process.cwd(), 'data', filepath);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(fullPath, buffer);

  const inserted = addFile(id, { filename: file.name, filepath, filetype });
  return NextResponse.json(inserted, { status: 201 });
}
