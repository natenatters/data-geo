import { NextRequest, NextResponse } from 'next/server';
import { getSource, updateSource, deleteSource } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const source = getSource(parseInt(params.id));
  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }
  return NextResponse.json(source);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const updated = updateSource(parseInt(params.id), body);
  if (!updated) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const success = deleteSource(parseInt(params.id));
  if (!success) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
