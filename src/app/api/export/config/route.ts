import { NextResponse } from 'next/server';
import { getAllSources } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const allStage4 = getAllSources({ stage: '4' });
  const overlays = allStage4.filter(s => s.source_type === 'map_overlay');
  const vectors = allStage4.filter(s => s.source_type === 'vector_features');

  const config = {
    imagery: overlays.map(s => ({
      id: s.id,
      name: s.name,
      era: s.era,
      yearStart: s.year_start,
      yearEnd: s.year_end,
      tiles: s.tiles,
      bounds: s.bounds_west ? {
        west: s.bounds_west,
        south: s.bounds_south,
        east: s.bounds_east,
        north: s.bounds_north,
      } : null,
    })),
    vectors: vectors.map(s => ({
      id: s.id,
      name: s.name,
      era: s.era,
      yearStart: s.year_start,
      yearEnd: s.year_end,
    })),
    generated: new Date().toISOString(),
  };

  return new NextResponse(JSON.stringify(config, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="imagery-config.json"',
    },
  });
}
