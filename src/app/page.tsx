'use client';

import { useEffect, useState } from 'react';
import Timeline from '@/components/Timeline';
import { STAGES, ERAS } from '@/lib/types';
import type { Era } from '@/lib/types';

interface Stats {
  total: number;
  byStage: { stage: number; count: number }[];
  byEra: { era: string; count: number }[];
  byType: { source_type: string; count: number }[];
  timelineData: {
    id: number;
    name: string;
    year_start: number;
    year_end: number | null;
    era: string;
    stage: number;
    source_type: string;
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <div className="text-gray-500 text-sm">Loading dashboard...</div>;
  }

  const stageMap = Object.fromEntries(stats.byStage.map(s => [s.stage, s.count]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Sources</div>
        </div>
        {[1, 2, 3, 4].map(stage => (
          <div key={stage} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stageMap[stage] || 0}</div>
            <div className="text-xs text-gray-500">{STAGES[stage]}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <Timeline data={stats.timelineData} />

      {/* Era breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Sources by Era</h3>
        <div className="space-y-2">
          {stats.byEra.map(({ era, count }) => {
            const eraInfo = ERAS[era as Era];
            const pct = stats.total ? (count / stats.total) * 100 : 0;
            return (
              <div key={era} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600">{eraInfo?.label || era}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: eraInfo?.color || '#6b7280' }}
                  />
                </div>
                <div className="w-8 text-xs text-gray-500 text-right">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Pipeline Status</h3>
        <div className="flex items-end gap-2 h-32">
          {[1, 2, 3, 4].map(stage => {
            const count = stageMap[stage] || 0;
            const maxCount = Math.max(...Object.values(stageMap), 1);
            const height = (count / maxCount) * 100;
            const colors = ['bg-gray-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400'];
            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-700">{count}</span>
                <div className="w-full flex items-end" style={{ height: '80px' }}>
                  <div
                    className={`w-full rounded-t ${colors[stage - 1]} transition-all`}
                    style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 text-center">{STAGES[stage]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
