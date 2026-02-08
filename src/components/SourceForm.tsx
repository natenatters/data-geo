'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Source, SourceType, Era, Tile } from '@/lib/types';
import { ERAS, SOURCE_TYPES, STAGES } from '@/lib/types';

type FormData = {
  name: string;
  description: string;
  source_url: string;
  source_type: SourceType;
  stage: number;
  year_start: string;
  year_end: string;
  era: Era;
  bounds_west: string;
  bounds_south: string;
  bounds_east: string;
  bounds_north: string;
  notes: string;
  iiif_url: string;
  georeference_url: string;
  tiles: Tile[];
};

function sourceToFormData(source?: Source): FormData {
  return {
    name: source?.name || '',
    description: source?.description || '',
    source_url: source?.source_url || '',
    source_type: source?.source_type || 'map_overlay',
    stage: source?.stage || 1,
    year_start: source?.year_start?.toString() || '',
    year_end: source?.year_end?.toString() || '',
    era: source?.era || 'modern',
    bounds_west: source?.bounds_west?.toString() || '',
    bounds_south: source?.bounds_south?.toString() || '',
    bounds_east: source?.bounds_east?.toString() || '',
    bounds_north: source?.bounds_north?.toString() || '',
    notes: source?.notes || '',
    iiif_url: source?.iiif_url || '',
    georeference_url: source?.georeference_url || '',
    tiles: source?.tiles || [],
  };
}

export default function SourceForm({ source }: { source?: Source }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(sourceToFormData(source));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!source;

  function update(field: keyof FormData, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      ...form,
      year_start: form.year_start ? parseInt(form.year_start) : null,
      year_end: form.year_end ? parseInt(form.year_end) : null,
      bounds_west: form.bounds_west ? parseFloat(form.bounds_west) : null,
      bounds_south: form.bounds_south ? parseFloat(form.bounds_south) : null,
      bounds_east: form.bounds_east ? parseFloat(form.bounds_east) : null,
      bounds_north: form.bounds_north ? parseFloat(form.bounds_north) : null,
      tiles: form.tiles.filter(t => t.url.trim()),
    };

    try {
      const url = isEdit ? `/api/sources/${source.id}` : '/api/sources';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const saved = await res.json();
      router.push(`/sources/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={e => update('name', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => update('description', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
        <input
          type="url"
          value={form.source_url}
          onChange={e => update('source_url', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={form.source_type}
            onChange={e => update('source_type', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(SOURCE_TYPES).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
          <select
            value={form.stage}
            onChange={e => update('stage', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(STAGES).map(([val, label]) => (
              <option key={val} value={val}>{val}. {label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Era</label>
          <select
            value={form.era}
            onChange={e => update('era', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ERAS).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year Start</label>
          <input
            type="number"
            value={form.year_start}
            onChange={e => update('year_start', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 79"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year End</label>
          <input
            type="number"
            value={form.year_end}
            onChange={e => update('year_end', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 410"
          />
        </div>
      </div>

      <fieldset className="border border-gray-200 rounded p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Bounding Box (WGS84)</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">West (lon)</label>
            <input
              type="number"
              step="any"
              value={form.bounds_west}
              onChange={e => update('bounds_west', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">East (lon)</label>
            <input
              type="number"
              step="any"
              value={form.bounds_east}
              onChange={e => update('bounds_east', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">South (lat)</label>
            <input
              type="number"
              step="any"
              value={form.bounds_south}
              onChange={e => update('bounds_south', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">North (lat)</label>
            <input
              type="number"
              step="any"
              value={form.bounds_north}
              onChange={e => update('bounds_north', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded p-4">
        <legend className="text-sm font-medium text-gray-700 px-2">Pipeline URLs</legend>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">IIIF URL <span className="text-gray-400">(manifest or info.json — needed for Stage 3)</span></label>
            <input
              type="url"
              value={form.iiif_url}
              onChange={e => update('iiif_url', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Georeference URL <span className="text-gray-400">(AllMaps annotation — needed for Stage 3)</span></label>
            <input
              type="url"
              value={form.georeference_url}
              onChange={e => update('georeference_url', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://editor.allmaps.org/..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tiles <span className="text-gray-400">(XYZ endpoints — needed for Stage 4)</span></label>
            {form.tiles.length > 0 && (
              <div className="space-y-2 mb-2">
                {form.tiles.map((tile, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tile.label}
                      onChange={e => {
                        const next = [...form.tiles];
                        next[i] = { ...next[i], label: e.target.value };
                        setForm(prev => ({ ...prev, tiles: next }));
                      }}
                      className="w-32 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Label"
                    />
                    <input
                      type="url"
                      value={tile.url}
                      onChange={e => {
                        const next = [...form.tiles];
                        next[i] = { ...next[i], url: e.target.value };
                        setForm(prev => ({ ...prev, tiles: next }));
                      }}
                      className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://allmaps.xyz/maps/{hash}/{z}/{x}/{y}.png"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = form.tiles.filter((_, j) => j !== i);
                        setForm(prev => ({ ...prev, tiles: next }));
                      }}
                      className="text-red-500 hover:text-red-700 text-sm px-1"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                const label = `Sheet ${form.tiles.length + 1}`;
                setForm(prev => ({ ...prev, tiles: [...prev.tiles, { url: '', label }] }));
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add tile
            </button>
          </div>
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Source' : 'Create Source'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
