'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Source } from '@/lib/types';
import { STAGES, ERAS, SOURCE_TYPES } from '@/lib/types';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function SourceDetail({ id }: { id: string }) {
  const router = useRouter();
  const [source, setSource] = useState<Source | null>(null);

  useEffect(() => {
    fetch(`${basePath}/data/sources.json`)
      .then(r => r.json())
      .then((sources: Source[]) => {
        const found = sources.find(s => s.id === parseInt(id));
        if (found) setSource(found);
        else router.push('/sources');
      });
  }, [id, router]);

  if (!source) {
    return <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>;
  }

  const s = source;
  const hasBounds = s.bounds_west !== null;
  const yearRange = s.year_start
    ? s.year_end && s.year_end !== s.year_start
      ? `${s.year_start}–${s.year_end}`
      : `${s.year_start}`
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/sources" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            Sources
          </Link>
          <span className="text-xs text-gray-300 dark:text-gray-600">/</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.name}</h1>
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span
            className="px-1.5 py-0.5 rounded font-medium text-white"
            style={{ backgroundColor: ERAS[s.era]?.color || '#6b7280' }}
          >
            {ERAS[s.era]?.label || s.era}
          </span>
          {yearRange && <span className="text-gray-500 dark:text-gray-400">{yearRange}</span>}
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{SOURCE_TYPES[s.source_type]}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-gray-500 dark:text-gray-400">{STAGES[s.stage]}</span>
        </div>
      </div>

      {/* Description */}
      {s.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{s.description}</p>
      )}

      {/* URLs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <ReadOnlyField label="Source URL" value={s.source_url} type="url" />
        <ReadOnlyField label="IIIF Manifest" value={s.iiif_url} type="url" />
        <ReadOnlyField label="Georeference" value={s.georeference_url} type="url" />
      </div>

      {/* Tiles */}
      {s.tiles.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tiles
            <span className="text-gray-400 dark:text-gray-500 font-normal ml-1.5">
              ({s.tiles.length} total{s.tiles.filter(t => t.georeferenced).length > 0 && `, ${s.tiles.filter(t => t.georeferenced).length} verified`})
            </span>
          </h2>
          <div className="space-y-1">
            {s.tiles.map((tile, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1">
                <span className={`shrink-0 ${tile.georeferenced ? 'text-green-500 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`}>
                  {tile.georeferenced ? '\u2713' : '\u25CB'}
                </span>
                <span className="text-gray-700 dark:text-gray-300 font-medium shrink-0">{tile.label}</span>
                <span className="text-gray-400 dark:text-gray-500 font-mono truncate">{tile.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bounds */}
      {hasBounds && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spatial Extent</h2>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            W:{s.bounds_west} S:{s.bounds_south} E:{s.bounds_east} N:{s.bounds_north}
          </div>
        </div>
      )}

      {/* Notes */}
      {s.notes && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{s.notes}</p>
        </div>
      )}
    </div>
  );
}

function ReadOnlyField({ label, value, type = 'text' }: { label: string; value: string | null; type?: 'text' | 'url' }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-32 shrink-0 pt-0.5">{label}</span>
      {type === 'url' ? (
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">{value}</a>
      ) : (
        <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
      )}
    </div>
  );
}
