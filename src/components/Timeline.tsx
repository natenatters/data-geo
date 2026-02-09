'use client';

import { ERAS, STAGES } from '@/lib/types';
import type { Era } from '@/lib/types';
import { MANCHESTER_EVENTS } from '@/lib/events';

interface BucketSource {
  id: number;
  name: string;
  year_start: number;
  era: string;
  stage: number;
  source_type: string;
}

export interface BucketStory {
  id: number;
  title: string;
  year_start: number;
  era: string;
}

export interface TimelineBucket {
  start: number;
  end: number;
  sources: BucketSource[];
  stories: BucketStory[];
}

const ERA_PROPORTIONS: { era: Era; start: number; end: number; widthPct: number }[] = [
  { era: 'roman', start: 79, end: 410, widthPct: 15 },
  { era: 'medieval', start: 410, end: 1540, widthPct: 30 },
  { era: 'industrial', start: 1540, end: 1837, widthPct: 35 },
  { era: 'modern', start: 1837, end: 2030, widthPct: 20 },
];

// Pre-compute cumulative percent offsets for each era segment
const ERA_SEGMENTS = (() => {
  let cumPct = 0;
  return ERA_PROPORTIONS.map(ep => {
    const seg = { ...ep, pctStart: cumPct, pctEnd: cumPct + ep.widthPct };
    cumPct += ep.widthPct;
    return seg;
  });
})();

const MIN_YEAR = ERA_PROPORTIONS[0].start;
const MAX_YEAR = ERA_PROPORTIONS[ERA_PROPORTIONS.length - 1].end;

export default function Timeline({
  buckets,
  selectedBucket,
  onSelectBucket,
}: {
  buckets: TimelineBucket[];
  selectedBucket: number | null;
  onSelectBucket: (start: number | null) => void;
}) {
  const maxCount = Math.max(...buckets.map(b => b.sources.length), 1);

  function yearToPercent(year: number) {
    const clamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
    for (const seg of ERA_SEGMENTS) {
      if (clamped <= seg.end) {
        const t = (clamped - seg.start) / (seg.end - seg.start);
        return seg.pctStart + t * seg.widthPct;
      }
    }
    return 100; // past all eras
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Chart area */}
      <div
        className="relative"
        style={{ height: '230px' }}
      >
        {/* Era background bands */}
        {ERA_PROPORTIONS.map(({ era, start, end }) => (
          <div
            key={era}
            className="absolute top-0 opacity-10"
            style={{
              left: `${yearToPercent(start)}%`,
              width: `${yearToPercent(end) - yearToPercent(start)}%`,
              backgroundColor: ERAS[era].color,
              bottom: '40px',
            }}
          />
        ))}

        {/* Event markers */}
        {MANCHESTER_EVENTS.map(event => (
          <div
            key={event.year}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${yearToPercent(event.year)}%`, bottom: '40px' }}
          >
            <div className="w-px h-full bg-gray-300 dark:bg-gray-600 opacity-50" />
            <div
              className="absolute top-0 text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap -translate-x-1/2 -rotate-45 origin-bottom-left"
              style={{ left: '2px', top: '2px' }}
              title={event.label}
            >
              {event.short || event.label}
            </div>
          </div>
        ))}

        {/* Bars */}
        {buckets.map(bucket => {
          const left = yearToPercent(bucket.start);
          const width = yearToPercent(bucket.end) - yearToPercent(bucket.start);
          const height = (bucket.sources.length / maxCount) * 100;
          const isSelected = selectedBucket === bucket.start;

          // Color by dominant stage in bucket
          const stageCounts: Record<number, number> = {};
          for (const s of bucket.sources) {
            stageCounts[s.stage] = (stageCounts[s.stage] || 0) + 1;
          }
          const dominantStage = Object.entries(stageCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0];
          const stageColors: Record<string, string> = {
            '1': '#9ca3af', // gray
            '2': '#60a5fa', // blue
            '3': '#fbbf24', // yellow
            '4': '#34d399', // green
          };
          const barColor = stageColors[dominantStage] || '#9ca3af';

          return (
            <div
              key={bucket.start}
              className="absolute cursor-pointer"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.5)}%`,
                height: `${Math.max(height, 3)}%`,
                bottom: '40px',
                backgroundColor: barColor,
                opacity: isSelected ? 1 : 0.7,
                borderRadius: '2px 2px 0 0',
                outline: isSelected ? '2px solid #2563eb' : 'none',
                outlineOffset: '1px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBucket(isSelected ? null : bucket.start);
              }}
              title={`${bucket.start}–${bucket.end}: ${bucket.sources.length} sources`}
            />
          );
        })}

        {/* Story diamond markers */}
        {buckets.filter(b => b.stories && b.stories.length > 0).map(bucket => {
          const left = yearToPercent(bucket.start);
          const width = yearToPercent(bucket.end) - yearToPercent(bucket.start);
          const isSelected = selectedBucket === bucket.start;

          return (
            <div
              key={`story-${bucket.start}`}
              className="absolute cursor-pointer"
              style={{
                left: `${left + width / 2}%`,
                bottom: '44px',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '8px',
                height: '8px',
                backgroundColor: '#9333ea',
                opacity: isSelected ? 1 : 0.8,
                outline: isSelected ? '2px solid #7c3aed' : 'none',
                outlineOffset: '1px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBucket(isSelected ? null : bucket.start);
              }}
              title={`${bucket.stories.length} stor${bucket.stories.length !== 1 ? 'ies' : 'y'}`}
            />
          );
        })}

        {/* Era labels + year markers along bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10">
          {/* Year tick marks — every 100 years */}
          {Array.from({ length: Math.floor((MAX_YEAR - 100) / 100) + 1 }, (_, i) => (i + 1) * 100)
            .filter(y => y >= MIN_YEAR && y <= MAX_YEAR)
            .map(year => (
              <div
                key={`yr-${year}`}
                className="absolute text-[9px] text-gray-400 dark:text-gray-500"
                style={{
                  left: `${yearToPercent(year)}%`,
                  top: '0px',
                  transform: year === 2000 ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {year}
              </div>
            ))}
          {/* Era word labels */}
          {ERA_PROPORTIONS.map(({ era, start, end }) => (
            <div
              key={era}
              className="absolute text-[10px] text-gray-500 dark:text-gray-400 text-center truncate"
              style={{
                left: `${yearToPercent(start)}%`,
                width: `${yearToPercent(end) - yearToPercent(start)}%`,
                top: '14px',
              }}
            >
              {ERAS[era].label}
            </div>
          ))}
        </div>
      </div>


      {/* Legend row */}
      <div className="flex items-center justify-between mt-3">
        {/* Stage legend */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
          {[1, 2, 3, 4].map(stage => {
            const colors: Record<number, string> = { 1: '#9ca3af', 2: '#60a5fa', 3: '#fbbf24', 4: '#34d399' };
            return (
              <div key={stage} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[stage] }} />
                <span>{STAGES[stage]}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: '#9333ea' }} />
            <span>Story</span>
          </div>
        </div>

      </div>
    </div>
  );
}
