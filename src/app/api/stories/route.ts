import { NextRequest, NextResponse } from 'next/server';
import { getAllStories, createStory } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getAllStories());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  const story = createStory(body);
  return NextResponse.json(story, { status: 201 });
}
