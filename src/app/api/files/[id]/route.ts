import { NextRequest, NextResponse } from 'next/server';
import { getAllSources, getSource, deleteFile } from '@/lib/store';
import path from 'path';
import fs from 'fs';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.geojson': 'application/geo+json',
  '.json': 'application/json',
  '.kml': 'application/vnd.google-earth.kml+xml',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileId = parseInt(params.id);

  const sources = getAllSources();
  for (const s of sources) {
    const full = getSource(s.id);
    if (!full) continue;
    const file = full.files.find(f => f.id === fileId);
    if (file) {
      const fullPath = path.join(process.cwd(), 'data', file.filepath);
      if (!fs.existsSync(fullPath)) {
        return NextResponse.json({ error: 'File not on disk' }, { status: 404 });
      }
      const ext = path.extname(file.filepath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const buffer = fs.readFileSync(fullPath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${file.filename}"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  }

  return NextResponse.json({ error: 'File not found' }, { status: 404 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileId = parseInt(params.id);

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
