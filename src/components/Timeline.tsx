'use client';

import { ERAS } from '@/lib/types';
import type { Era } from '@/lib/types';

interface TimelineItem {
  id: number;
  name: string;
  year_start: number;
  year_end: number | null;
  era: string;
  stage: number;
  source_type: string;
}

const ERA_RANGES: { era: Era; start: number; end: number }[] = [
  { era: 'roman', start: 79, end: 410 },
  { era: 'medieval', start: 410, end: 1540 },
  { era: 'industrial', start: 1540, end: 1837 },
  { era: 'victorian', start: 1837, end: 1901 },
  { era: 'modern', start: 1901, end: 2025 },
];

export default function Timeline({ data }: { data: TimelineItem[] }) {
  const minYear = 79;
  const maxYear = 2025;
  const totalSpan = maxYear - minYear;

  function yearToPercent(year: number) {
    return ((year - minYear) / totalSpan) * 100;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline Coverage</h3>

      {/* Era background bands */}
      <div className="relative h-8 rounded overflow-hidden mb-1">
        {ERA_RANGES.map(({ era, start, end }) => (
          <div
            key={era}
            className="absolute top-0 h-full opacity-20"
            style={{
              left: `${yearToPercent(start)}%`,
              width: `${yearToPercent(end) - yearToPercent(start)}%`,
              backgroundColor: ERAS[era].color,
            }}
          />
        ))}

        {/* Source bars */}
        {data.map(item => {
          const start = item.year_start;
          const end = item.year_end || item.year_start;
          const era = ERAS[item.era as Era];
          return (
            <div
              key={item.id}
              className="absolute h-2 rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              style={{
                left: `${yearToPercent(start)}%`,
                width: `${Math.max(yearToPercent(end) - yearToPercent(start), 0.5)}%`,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: era?.color || '#6b7280',
              }}
              title={`${item.name} (${start}–${end})`}
            />
          );
        })}
      </div>

      {/* Era labels */}
      <div className="relative h-5">
        {ERA_RANGES.map(({ era, start, end }) => (
          <div
            key={era}
            className="absolute text-[10px] text-gray-500 text-center"
            style={{
              left: `${yearToPercent(start)}%`,
              width: `${yearToPercent(end) - yearToPercent(start)}%`,
            }}
          >
            {ERAS[era].label}
          </div>
        ))}
      </div>
    </div>
  );
}
