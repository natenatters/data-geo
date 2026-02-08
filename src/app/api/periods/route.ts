import { NextResponse } from 'next/server';
import { getPeriodQuality, setPeriodQuality } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getPeriodQuality());
}

export async function PUT(request: Request) {
  const periods = await request.json();
  setPeriodQuality(periods);
  return NextResponse.json(periods);
}
