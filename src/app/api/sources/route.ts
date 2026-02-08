import { NextRequest, NextResponse } from 'next/server';
import { getAllSources, createSource } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sources = getAllSources({
    era: searchParams.get('era') || undefined,
    stage: searchParams.get('stage') || undefined,
    source_type: searchParams.get('source_type') || undefined,
    has_tiles: searchParams.get('has_tiles') || undefined,
    sort: searchParams.get('sort') || undefined,
    order: searchParams.get('order') || undefined,
  });
  return NextResponse.json(sources);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const source = createSource(body);
  return NextResponse.json(source, { status: 201 });
}
