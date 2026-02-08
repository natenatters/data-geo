import { NextRequest, NextResponse } from 'next/server';
import { getStory, getStoryContent, updateStory, deleteStory } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const story = getStory(parseInt(params.id));
  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }
  const resolvedContent = getStoryContent(story);
  return NextResponse.json({ ...story, resolvedContent });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const updated = updateStory(parseInt(params.id), body);
  if (!updated) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const success = deleteStory(parseInt(params.id));
  if (!success) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
