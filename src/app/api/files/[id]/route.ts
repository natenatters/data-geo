import { NextRequest, NextResponse } from 'next/server';
import { getAllSources, getSource, deleteFile } from '@/lib/store';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileId = parseInt(params.id);

  // Find which source has this file
  const sources = getAllSources();
  for (const s of sources) {
    const full = getSource(s.id);
    if (!full) continue;
    const file = full.files.find(f => f.id === fileId);
    if (file) {
      deleteFile(s.id, fileId);
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: 'File not found' }, { status: 404 });
}
