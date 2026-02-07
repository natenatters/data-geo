import { NextResponse } from 'next/server';
import { getAllSources, getSource } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = getAllSources({ stage: '4' });

  const czml: Record<string, unknown>[] = [
    {
      id: 'document',
      name: 'Manchester Historical Data',
      version: '1.0',
      clock: {
        interval: '0079-01-01T00:00:00Z/2025-12-31T23:59:59Z',
        currentTime: '1850-01-01T00:00:00Z',
        multiplier: 31536000,
        range: 'LOOP_STOP',
        step: 'SYSTEM_CLOCK_MULTIPLIER',
      },
    },
  ];

  for (const source of sources) {
    const full = getSource(source.id);
    const files = full?.files.filter(f => ['czml', 'geojson'].includes(f.filetype)) || [];

    const yearStart = source.year_start || 79;
    const yearEnd = source.year_end || 2025;
    const startPad = String(yearStart).padStart(4, '0');
    const endPad = String(yearEnd).padStart(4, '0');

    if (source.bounds_west && source.bounds_south && source.bounds_east && source.bounds_north) {
      const centerLon = (source.bounds_west + source.bounds_east) / 2;
      const centerLat = (source.bounds_south + source.bounds_north) / 2;

      czml.push({
        id: `source-${source.id}`,
        name: source.name,
        description: source.description || '',
        availability: `${startPad}-01-01T00:00:00Z/${endPad}-12-31T23:59:59Z`,
        position: {
          cartographicDegrees: [centerLon, centerLat, 0],
        },
        point: {
          pixelSize: 10,
          color: { rgba: [255, 165, 0, 255] },
          outlineColor: { rgba: [255, 255, 255, 255] },
          outlineWidth: 2,
        },
        properties: {
          source_id: source.id,
          source_type: source.source_type,
          era: source.era,
          files: files.map(f => f.filepath),
        },
      });
    }
  }

  return new NextResponse(JSON.stringify(czml, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="manchester-historical.czml"',
    },
  });
}
