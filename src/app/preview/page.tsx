'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Source } from '@/lib/types';

const CesiumPreview = dynamic(() => import('@/components/CesiumPreview'), { ssr: false });

export default function PreviewPage() {
  const [sources, setSources] = useState<Source[]>([]);
  // Map<sourceId, Set<tileIndex>> — which tiles are enabled per source
  const [enabledTiles, setEnabledTiles] = useState<Map<number, Set<number>>>(new Map());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/sources?has_tiles=1')
      .then(r => r.json())
      .then((data: Source[]) => {
        setSources(data);
        // Enable only the first georeferenced source by default
        const initial = new Map<number, Set<number>>();
        const first = data.find((s: Source) => s.tiles.some(t => t.georeferenced));
        if (first) {
          const geoIndices = first.tiles
            .map((t, i) => t.georeferenced ? i : -1)
            .filter(i => i >= 0);
          initial.set(first.id, new Set(geoIndices));
        }
        setEnabledTiles(initial);
      });
  }, []);

  function toggleSource(id: number, tileCount: number) {
    setEnabledTiles(prev => {
      const next = new Map(prev);
      const current = next.get(id);
      if (current && current.size === tileCount) {
        // All on → all off
        next.delete(id);
      } else {
        // Some or none → all on
        next.set(id, new Set(Array.from({ length: tileCount }, (_, i) => i)));
      }
      return next;
    });
  }

  function toggleTile(sourceId: number, tileIdx: number) {
    setEnabledTiles(prev => {
      const next = new Map(prev);
      const current = new Set(next.get(sourceId) || []);
      if (current.has(tileIdx)) {
        current.delete(tileIdx);
      } else {
        current.add(tileIdx);
      }
      if (current.size === 0) {
        next.delete(sourceId);
      } else {
        next.set(sourceId, current);
      }
      return next;
    });
  }

  function toggleExpanded(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Compute checkbox state for a source
  function sourceCheckState(id: number, tileCount: number): 'all' | 'some' | 'none' {
    const enabled = enabledTiles.get(id);
    if (!enabled || enabled.size === 0) return 'none';
    if (enabled.size === tileCount) return 'all';
    return 'some';
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Cesium Preview</h1>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Viewer */}
        <div className="flex-1 rounded-lg overflow-hidden border border-gray-200">
          <CesiumPreview czmlUrl="/api/export/czml" sources={sources} enabledTiles={enabledTiles} />
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-white rounded-lg border border-gray-200 p-3 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Sources with Tiles ({sources.length})
          </h3>
          {sources.length === 0 ? (
            <p className="text-xs text-gray-500">
              No sources with tiles yet. Add tiles to sources to see them here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {sources.map(s => {
                const tileCount = s.tiles.length;
                const isMulti = tileCount > 1;
                const state = sourceCheckState(s.id, tileCount);
                const isExpanded = expanded.has(s.id);
                const hasGeoTile = s.tiles.some(t => t.georeferenced);

                return (
                  <div key={s.id}>
                    <div className="flex items-start gap-2 p-1.5 rounded hover:bg-gray-50">
                      {isMulti ? (
                        <button
                          onClick={() => toggleExpanded(s.id)}
                          className="mt-0.5 text-xs text-gray-400 w-4 text-center shrink-0"
                        >
                          {isExpanded ? '\u25BC' : '\u25B6'}
                        </button>
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <SourceCheckbox
                        state={state}
                        onChange={() => toggleSource(s.id, tileCount)}
                      />
                      <div
                        className="cursor-pointer select-none"
                        onClick={() => isMulti && toggleExpanded(s.id)}
                      >
                        <div className={`text-xs leading-tight ${hasGeoTile ? 'text-gray-900' : 'text-gray-500 italic'}`}>{s.name}</div>
                        <div className="text-[10px] text-gray-500">
                          {s.year_start}–{s.year_end || '?'}
                          {isMulti && ` · ${tileCount} sheets`}
                          {!hasGeoTile && ' · unverified'}
                        </div>
                      </div>
                    </div>

                    {/* Per-sheet toggles for multi-tile sources */}
                    {isMulti && isExpanded && (
                      <div className="ml-8 border-l border-gray-200 pl-2 mb-1">
                        {s.tiles.map((tile, i) => {
                          const tileEnabled = enabledTiles.get(s.id)?.has(i) ?? false;
                          return (
                            <label
                              key={i}
                              className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={tileEnabled}
                                onChange={() => toggleTile(s.id, i)}
                                className="mt-0"
                              />
                              <span className="text-[11px] text-gray-700">{tile.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tri-state checkbox component
function SourceCheckbox({ state, onChange }: { state: 'all' | 'some' | 'none'; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = state === 'some';
    }
  }, [state]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === 'all'}
      onChange={onChange}
      className="mt-0.5 shrink-0"
    />
  );
}
