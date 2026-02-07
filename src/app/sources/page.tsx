'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Source, Era, SourceType } from '@/lib/types';
import { ERAS, SOURCE_TYPES, STAGES } from '@/lib/types';
import SourceCard from '@/components/SourceCard';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [era, setEra] = useState('');
  const [stage, setStage] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [sort, setSort] = useState('year_start');
  const [order, setOrder] = useState('asc');

  const fetchSources = useCallback(() => {
    const params = new URLSearchParams();
    if (era) params.set('era', era);
    if (stage) params.set('stage', stage);
    if (sourceType) params.set('source_type', sourceType);
    params.set('sort', sort);
    params.set('order', order);

    fetch(`/api/sources?${params}`)
      .then(r => r.json())
      .then(setSources);
  }, [era, stage, sourceType, sort, order]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  async function handleAdvanceStage(id: number, newStage: number) {
    await fetch(`/api/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    fetchSources();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sources</h1>
        <span className="text-sm text-gray-500">{sources.length} sources</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-lg border border-gray-200 p-3">
        <select
          value={era}
          onChange={e => setEra(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All Eras</option>
          {Object.entries(ERAS).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={stage}
          onChange={e => setStage(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All Stages</option>
          {Object.entries(STAGES).map(([val, label]) => (
            <option key={val} value={val}>{val}. {label}</option>
          ))}
        </select>

        <select
          value={sourceType}
          onChange={e => setSourceType(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All Types</option>
          {Object.entries(SOURCE_TYPES).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <label className="text-xs text-gray-500">Sort:</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="year_start">Year</option>
            <option value="stage">Stage</option>
            <option value="name">Name</option>
            <option value="updated_at">Updated</option>
          </select>
          <button
            onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="border border-gray-300 rounded px-2 py-1 text-sm hover:bg-gray-50"
          >
            {order === 'asc' ? '\u2191' : '\u2193'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map(source => (
          <SourceCard
            key={source.id}
            source={source}
            onAdvanceStage={handleAdvanceStage}
          />
        ))}
      </div>

      {sources.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-12">
          No sources found. Try adjusting filters or add a new source.
        </div>
      )}
    </div>
  );
}
