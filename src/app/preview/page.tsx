'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Source } from '@/lib/types';

const CesiumPreview = dynamic(() => import('@/components/CesiumPreview'), { ssr: false });

export default function PreviewPage() {
  const [sources, setSources] = useState<Source[]>([]);
  // Map<sourceId, Set<tileIndex>> — which tiles are enabled per source
  const [enabledTiles, setEnabledTiles] = useState<Map<number, Set<number>>>(new Map());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  // Map<sourceId, opacity 0-1>
  const [opacities, setOpacities] = useState<Map<number, number>>(new Map());
  // Ordered list of source IDs for layer stacking (bottom → top)
  const [layerOrder, setLayerOrder] = useState<number[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

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
        setLayerOrder(data.map(s => s.id));
      });
  }, []);

  function flyToBounds(source: Source) {
    const viewer = viewerRef.current;
    if (!viewer || !window.Cesium) return;
    const { bounds_west: w, bounds_south: s, bounds_east: e, bounds_north: n } = source;
    if (w == null || s == null || e == null || n == null) return;
    const Cesium = window.Cesium;
    viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(w, s, e, n),
      duration: 1.0,
    });
  }

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
        // Fly to source when enabling
        const source = sources.find(s => s.id === id);
        if (source) flyToBounds(source);
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

  function setOpacity(sourceId: number, value: number) {
    setOpacities(prev => {
      const next = new Map(prev);
      next.set(sourceId, value);
      return next;
    });
  }

  function moveLayer(sourceId: number, direction: 'up' | 'down') {
    setLayerOrder(prev => {
      const idx = prev.indexOf(sourceId);
      if (idx < 0) return prev;
      // "up" in visual stacking = higher index (rendered on top)
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
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

  const onViewerReady = useCallback((viewer: unknown) => {
    viewerRef.current = viewer;
  }, []);

  // Sort sources by layer order for sidebar display
  const sortedSources = [...sources].sort((a, b) => {
    const ai = layerOrder.indexOf(a.id);
    const bi = layerOrder.indexOf(b.id);
    // Show top layers first in sidebar (reversed from render order)
    return bi - ai;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Map Viewer</h1>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Viewer */}
        <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <CesiumPreview
            sources={sources}
            enabledTiles={enabledTiles}
            opacities={opacities}
            layerOrder={layerOrder}
            onViewerReady={onViewerReady}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Layers ({sources.length})
          </h3>
          {sources.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No sources with tiles yet. Add tiles to sources to see them here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {sortedSources.map(s => {
                const tileCount = s.tiles.length;
                const isMulti = tileCount > 1;
                const state = sourceCheckState(s.id, tileCount);
                const isExpanded = expanded.has(s.id);
                const hasGeoTile = s.tiles.some(t => t.georeferenced);
                const isEnabled = state !== 'none';
                const opacity = opacities.get(s.id) ?? 0.75;
                const orderIdx = layerOrder.indexOf(s.id);

                return (
                  <div key={s.id}>
                    <div className="flex items-start gap-2 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                      {isMulti ? (
                        <button
                          onClick={() => toggleExpanded(s.id)}
                          className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 w-4 text-center shrink-0"
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
                      <div className="flex-1 min-w-0">
                        <div
                          className="cursor-pointer select-none"
                          onClick={() => isMulti ? toggleExpanded(s.id) : flyToBounds(s)}
                        >
                          <div className={`text-xs leading-tight ${hasGeoTile ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 italic'}`}>{s.name}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {s.year_start}–{s.year_end || '?'}
                            {isMulti && ` · ${tileCount} sheets`}
                            {!hasGeoTile && ' · unverified'}
                          </div>
                        </div>

                        {/* Opacity slider + layer controls — shown when enabled */}
                        {isEnabled && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={opacity}
                              onChange={e => setOpacity(s.id, parseFloat(e.target.value))}
                              className="flex-1 h-1 accent-blue-500"
                              title={`Opacity: ${Math.round(opacity * 100)}%`}
                            />
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 w-7 text-right tabular-nums">
                              {Math.round(opacity * 100)}%
                            </span>
                            <button
                              onClick={() => moveLayer(s.id, 'up')}
                              disabled={orderIdx === layerOrder.length - 1}
                              className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 px-0.5"
                              title="Bring forward"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveLayer(s.id, 'down')}
                              disabled={orderIdx === 0}
                              className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 px-0.5"
                              title="Send backward"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Per-sheet toggles for multi-tile sources */}
                    {isMulti && isExpanded && (
                      <div className="ml-8 border-l border-gray-200 dark:border-gray-700 pl-2 mb-1">
                        {s.tiles.map((tile, i) => {
                          const tileEnabled = enabledTiles.get(s.id)?.has(i) ?? false;
                          return (
                            <label
                              key={i}
                              className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={tileEnabled}
                                onChange={() => toggleTile(s.id, i)}
                                className="mt-0"
                              />
                              <span className="text-[11px] text-gray-700 dark:text-gray-300">{tile.label}</span>
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
