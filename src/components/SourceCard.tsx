'use client';

import Link from 'next/link';
import type { Source } from '@/lib/types';
import { ERAS, SOURCE_TYPES } from '@/lib/types';
import StageIndicator from './StageIndicator';

export default function SourceCard({
  source,
}: {
  source: Source;
}) {
  const era = ERAS[source.era];
  const yearRange = source.year_start
    ? source.year_end && source.year_end !== source.year_start
      ? `${source.year_start}–${source.year_end}`
      : `${source.year_start}`
    : 'Unknown date';

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/sources/${source.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 leading-tight">
          {source.name}
        </Link>
        <StageIndicator stage={source.stage} />
      </div>

      <div className="flex items-center gap-2 mb-2 text-xs">
        <span
          className="px-1.5 py-0.5 rounded font-medium text-white"
          style={{ backgroundColor: era?.color || '#6b7280' }}
        >
          {era?.label || source.era}
        </span>
        <span className="text-gray-500 dark:text-gray-400">{yearRange}</span>
        <span className="text-gray-400 dark:text-gray-500">|</span>
        <span className="text-gray-500 dark:text-gray-400">{SOURCE_TYPES[source.source_type]}</span>
      </div>

      {source.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{source.description}</p>
      )}

      <div className="flex items-center justify-between">
        <Link
          href={`/sources/${source.id}`}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          View details
        </Link>
      </div>
    </div>
  );
}
