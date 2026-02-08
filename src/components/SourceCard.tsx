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
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/sources/${source.id}`} className="font-medium text-gray-900 hover:text-blue-600 leading-tight">
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
        <span className="text-gray-500">{yearRange}</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">{SOURCE_TYPES[source.source_type]}</span>
      </div>

      {source.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{source.description}</p>
      )}

      <div className="flex items-center justify-between">
        <Link
          href={`/sources/${source.id}`}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View details
        </Link>
      </div>
    </div>
  );
}
