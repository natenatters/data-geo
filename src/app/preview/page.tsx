'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Source } from '@/lib/types';

const CesiumPreview = dynamic(() => import('@/components/CesiumPreview'), { ssr: false });

export default function PreviewPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [enabled, setEnabled] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/sources?stage=4')
      .then(r => r.json())
      .then((data: Source[]) => {
        setSources(data);
        setEnabled(new Set(data.map(s => s.id)));
      });
  }, []);

  function toggleSource(id: number) {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Cesium Preview</h1>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Viewer */}
        <div className="flex-1 rounded-lg overflow-hidden border border-gray-200">
          <CesiumPreview czmlUrl="/api/export/czml" />
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg border border-gray-200 p-3 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Cesium-Ready Sources ({sources.length})
          </h3>
          {sources.length === 0 ? (
            <p className="text-xs text-gray-500">
              No sources at Stage 4 yet. Advance sources through the pipeline to see them here.
            </p>
          ) : (
            <div className="space-y-1">
              {sources.map(s => (
                <label
                  key={s.id}
                  className="flex items-start gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabled.has(s.id)}
                    onChange={() => toggleSource(s.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-xs text-gray-900 leading-tight">{s.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {s.year_start}–{s.year_end || '?'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
