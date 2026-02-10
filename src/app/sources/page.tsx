'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Source, Era, SourceType } from '@/lib/types';
import { ERAS, SOURCE_TYPES, STAGES } from '@/lib/types';
import SourceCard from '@/components/SourceCard';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function SourcesPage() {
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [era, setEra] = useState('');
  const [stage, setStage] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [sort, setSort] = useState('year_start');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    fetch(`${basePath}/data/sources.json`).then(r => r.json()).then(setAllSources);
  }, []);

  const sources = useMemo(() => {
    let filtered = [...allSources];
    if (era) filtered = filtered.filter(s => s.era === era);
    if (stage) filtered = filtered.filter(s => s.stage === parseInt(stage));
    if (sourceType) filtered = filtered.filter(s => s.source_type === sourceType);

    const sortOrder = order === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const aVal = a[sort as keyof Source];
      const bVal = b[sort as keyof Source];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });
    return filtered;
  }, [allSources, era, stage, sourceType, sort, order]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sources</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{sources.length} sources</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <select
          value={era}
          onChange={e => setEra(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Eras</option>
          {Object.entries(ERAS).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={stage}
          onChange={e => setStage(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Stages</option>
          {Object.entries(STAGES).map(([val, label]) => (
            <option key={val} value={val}>{val}. {label}</option>
          ))}
        </select>

        <select
          value={sourceType}
          onChange={e => setSourceType(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Types</option>
          {Object.entries(SOURCE_TYPES).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <label className="text-xs text-gray-500 dark:text-gray-400">Sort:</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="year_start">Year</option>
            <option value="stage">Stage</option>
            <option value="name">Name</option>
            <option value="updated_at">Updated</option>
          </select>
          <button
            onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {order === 'asc' ? '\u2191' : '\u2193'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map(source => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>

      {sources.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-12">
          No sources found. Try adjusting filters.
        </div>
      )}
    </div>
  );
}
