'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Timeline from '@/components/Timeline';
import type { TimelineBucket, BucketStory } from '@/components/Timeline';
import { STAGES, ERAS, SOURCE_TYPES } from '@/lib/types';
import type { Era } from '@/lib/types';

interface UndatedSource {
  id: number;
  name: string;
  era: string;
  stage: number;
  source_type: string;
}

interface Stats {
  total: number;
  storyTotal: number;
  byStage: { stage: number; count: number }[];
  byEra: { era: string; count: number }[];
  byType: { source_type: string; count: number }[];
  buckets: TimelineBucket[];
  undated: UndatedSource[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) {
    return <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>;
  }

  const selectedBucketData = selectedBucket !== null
    ? stats.buckets.find(b => b.start === selectedBucket)
    : null;
  const selectedSources = selectedBucketData?.sources || null;
  const selectedStories = selectedBucketData?.stories || [];

  const datedCount = stats.total - stats.undated.length;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Timeline</h1>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {stats.total} sources ({datedCount} dated, {stats.undated.length} undated)
          {stats.storyTotal > 0 && <> &middot; {stats.storyTotal} {stats.storyTotal === 1 ? 'story' : 'stories'}</>}
        </div>
      </div>

      {/* Timeline bar chart */}
      <Timeline
        buckets={stats.buckets}
        selectedBucket={selectedBucket}
        onSelectBucket={setSelectedBucket}
      />

      {/* Selected bucket source list */}
      {selectedSources && selectedSources.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedBucketData!.start}–{selectedBucketData!.end}
              <span className="text-gray-400 dark:text-gray-500 font-normal ml-1.5">
                ({selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <button
              onClick={() => setSelectedBucket(null)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {selectedSources.map(s => (
              <Link
                key={s.id}
                href={`/sources/${s.id}`}
                className="flex items-center gap-2 py-1.5 px-2 -mx-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group"
              >
                <span
                  className="px-1 py-0.5 rounded text-[10px] font-medium text-white shrink-0"
                  style={{ backgroundColor: ERAS[s.era as Era]?.color || '#6b7280' }}
                >
                  {s.year_start}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {s.name}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                  {SOURCE_TYPES[s.source_type as keyof typeof SOURCE_TYPES]}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                  {STAGES[s.stage]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Selected bucket stories */}
      {selectedStories.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-purple-800 dark:text-purple-300">
              Stories
              <span className="text-purple-500 dark:text-purple-400 font-normal ml-1.5">
                ({selectedStories.length})
              </span>
            </h2>
            {!selectedSources?.length && (
              <button
                onClick={() => setSelectedBucket(null)}
                className="text-xs text-purple-400 dark:text-purple-500 hover:text-purple-600 dark:hover:text-purple-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1">
            {selectedStories.map(s => (
              <Link
                key={s.id}
                href={`/stories/${s.id}`}
                className="flex items-center gap-2 py-1.5 px-2 -mx-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900 group"
              >
                <span className="inline-block w-2.5 h-2.5 rotate-45 bg-purple-500 shrink-0" />
                <span className="text-sm text-purple-800 dark:text-purple-300 truncate flex-1 group-hover:text-purple-600 dark:group-hover:text-purple-200">
                  {s.title}
                </span>
                <span
                  className="px-1 py-0.5 rounded text-[10px] font-medium text-white shrink-0"
                  style={{ backgroundColor: ERAS[s.era as Era]?.color || '#6b7280' }}
                >
                  {s.year_start}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Undated sources */}
      {stats.undated.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
          <h2 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
            Undated sources
            <span className="text-amber-600 dark:text-amber-400 font-normal ml-1.5">
              ({stats.undated.length} need dating)
            </span>
          </h2>
          <div className="space-y-1">
            {stats.undated.map(s => (
              <Link
                key={s.id}
                href={`/sources/${s.id}`}
                className="flex items-center gap-2 py-1 text-sm group"
              >
                <span className="text-amber-700 dark:text-amber-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate flex-1">
                  {s.name}
                </span>
                <span className="text-[10px] text-amber-500 dark:text-amber-400 shrink-0">
                  {SOURCE_TYPES[s.source_type as keyof typeof SOURCE_TYPES]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.byStage.map(({ stage, count }) => (
          <div key={stage} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{count}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{STAGES[stage]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
