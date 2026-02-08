'use client';

import { useState } from 'react';
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

export interface PeriodQuality {
  start: number;
  end: number;
  quality: 'good' | 'sparse' | 'gap' | 'rich';
  notes?: string;
}

const ERA_PROPORTIONS: { era: Era; start: number; end: number; widthPct: number }[] = [
  { era: 'roman', start: 79, end: 410, widthPct: 20 },
  { era: 'medieval', start: 410, end: 1540, widthPct: 18 },
  { era: 'industrial', start: 1540, end: 1837, widthPct: 40 },
  { era: 'victorian', start: 1837, end: 1901, widthPct: 12 },
  { era: 'modern', start: 1901, end: 2030, widthPct: 10 },
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

const QUALITY_COLORS: Record<string, string> = {
  good: '#22c55e',   // green
  sparse: '#eab308', // yellow
  gap: '#ef4444',    // red
  rich: '#3b82f6',   // blue
};

export default function Timeline({
  buckets,
  selectedBucket,
  onSelectBucket,
  periodQuality = [],
  onClickPeriod,
}: {
  buckets: TimelineBucket[];
  selectedBucket: number | null;
  onSelectBucket: (start: number | null) => void;
  periodQuality?: PeriodQuality[];
  onClickPeriod?: (year: number) => void;
}) {
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);

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

  function percentToYear(pct: number) {
    const clamped = Math.max(0, Math.min(100, pct));
    for (const seg of ERA_SEGMENTS) {
      if (clamped <= seg.pctEnd) {
        const t = (clamped - seg.pctStart) / seg.widthPct;
        return Math.round(seg.start + t * (seg.end - seg.start));
      }
    }
    return MAX_YEAR;
  }

  const hovered = hoveredBucket !== null ? buckets.find(b => b.start === hoveredBucket) : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Chart area */}
      <div
        className="relative"
        style={{ height: '200px' }}
        onDoubleClick={(e) => {
          if (!onClickPeriod) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = ((e.clientX - rect.left) / rect.width) * 100;
          const year = percentToYear(pct);
          onClickPeriod(year);
        }}
      >
        {/* Period quality overlays (bottom band) */}
        {periodQuality.map((pq, i) => (
          <div
            key={i}
            className="absolute bottom-6 h-1.5 opacity-60"
            style={{
              left: `${yearToPercent(pq.start)}%`,
              width: `${yearToPercent(pq.end) - yearToPercent(pq.start)}%`,
              backgroundColor: QUALITY_COLORS[pq.quality],
            }}
            title={`${pq.quality}: ${pq.start}–${pq.end}${pq.notes ? ` — ${pq.notes}` : ''}`}
          />
        ))}

        {/* Era background bands */}
        {ERA_PROPORTIONS.map(({ era, start, end }) => (
          <div
            key={era}
            className="absolute top-0 bottom-6 opacity-10"
            style={{
              left: `${yearToPercent(start)}%`,
              width: `${yearToPercent(end) - yearToPercent(start)}%`,
              backgroundColor: ERAS[era].color,
            }}
          />
        ))}

        {/* Event markers */}
        {MANCHESTER_EVENTS.map(event => (
          <div
            key={event.year}
            className="absolute top-0 bottom-6 flex flex-col items-center"
            style={{ left: `${yearToPercent(event.year)}%` }}
          >
            <div className="w-px h-full bg-gray-300 opacity-50" />
            <div
              className="absolute top-0 text-[9px] text-gray-400 whitespace-nowrap -translate-x-1/2 -rotate-45 origin-bottom-left"
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
          const isHovered = hoveredBucket === bucket.start;

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
              className="absolute bottom-6 cursor-pointer transition-opacity"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.5)}%`,
                height: `${Math.max(height, 3)}%`,
                bottom: '30px', // above quality band
                backgroundColor: barColor,
                opacity: isSelected ? 1 : isHovered ? 0.9 : 0.7,
                borderRadius: '2px 2px 0 0',
                outline: isSelected ? '2px solid #2563eb' : 'none',
                outlineOffset: '1px',
              }}
              onMouseEnter={() => setHoveredBucket(bucket.start)}
              onMouseLeave={() => setHoveredBucket(null)}
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
          const isHovered = hoveredBucket === bucket.start;

          return (
            <div
              key={`story-${bucket.start}`}
              className="absolute cursor-pointer"
              style={{
                left: `${left + width / 2}%`,
                bottom: '24px',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '8px',
                height: '8px',
                backgroundColor: '#9333ea',
                opacity: isSelected ? 1 : isHovered ? 0.9 : 0.8,
                outline: isSelected ? '2px solid #7c3aed' : 'none',
                outlineOffset: '1px',
              }}
              onMouseEnter={() => setHoveredBucket(bucket.start)}
              onMouseLeave={() => setHoveredBucket(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBucket(isSelected ? null : bucket.start);
              }}
              title={`${bucket.stories.length} stor${bucket.stories.length !== 1 ? 'ies' : 'y'}`}
            />
          );
        })}

        {/* Era labels along bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-5">
          {ERA_PROPORTIONS.map(({ era, start, end }) => (
            <div
              key={era}
              className="absolute text-[10px] text-gray-500 text-center truncate"
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

      {/* Hover tooltip */}
      {hovered && (
        <div className="mt-2 px-3 py-2 bg-gray-50 rounded border border-gray-100 text-xs">
          <div className="font-medium text-gray-700 mb-1">
            {hovered.start}–{hovered.end} ({hovered.sources.length} source{hovered.sources.length !== 1 ? 's' : ''}
            {hovered.stories && hovered.stories.length > 0 && `, ${hovered.stories.length} stor${hovered.stories.length !== 1 ? 'ies' : 'y'}`})
          </div>
          {hovered.stories && hovered.stories.length > 0 && (
            <div className="text-purple-600 space-y-0.5 mb-1">
              {hovered.stories.map(s => (
                <div key={s.id} className="truncate flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rotate-45 bg-purple-500 shrink-0" />
                  {s.title}
                </div>
              ))}
            </div>
          )}
          <div className="text-gray-500 space-y-0.5 max-h-24 overflow-y-auto">
            {hovered.sources.slice(0, 8).map(s => (
              <div key={s.id} className="truncate">{s.name}</div>
            ))}
            {hovered.sources.length > 8 && (
              <div className="text-gray-400">+{hovered.sources.length - 8} more</div>
            )}
          </div>
        </div>
      )}

      {/* Legend row */}
      <div className="flex items-center justify-between mt-3">
        {/* Stage legend */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
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

        {/* Quality legend */}
        {periodQuality.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            {Object.entries(QUALITY_COLORS).map(([quality, color]) => (
              <div key={quality} className="flex items-center gap-1">
                <div className="w-2.5 h-1 rounded-sm" style={{ backgroundColor: color }} />
                <span className="capitalize">{quality}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {onClickPeriod && (
        <div className="text-[10px] text-gray-400 mt-1">
          Double-click timeline to tag a period
        </div>
      )}
    </div>
  );
}
