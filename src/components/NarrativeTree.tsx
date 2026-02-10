'use client';

import { useEffect, useRef, useMemo } from 'react';
import {
  LINEAGE_NODES,
  LINEAGE_LINKS,
  LINEAGE_YEAR_MIN,
  LINEAGE_YEAR_MAX,
  LANE_COLORS,
  LANE_LABELS,
  type LineageNode,
} from '@/lib/narrative-lineage';
import { NARRATIVE_PERIODS } from '@/lib/narrative-periods';

interface Props {
  activePeriodId: string;
  onPeriodChange?: (periodId: string) => void;
}

const LANES: LineageNode['lane'][] = ['crown', 'lancaster', 'cornwall'];
const YEAR_RANGE = LINEAGE_YEAR_MAX - LINEAGE_YEAR_MIN;

// Convert a year to a percentage position (0-100)
function yPct(year: number) {
  return ((year - LINEAGE_YEAR_MIN) / YEAR_RANGE) * 100;
}

// Total height of the tree in pixels — proportional spacing
const TREE_HEIGHT = 3000;
const PADDING_Y = 60;
const TOTAL_HEIGHT = TREE_HEIGHT + PADDING_Y * 2;

function yPx(year: number) {
  return PADDING_Y + ((year - LINEAGE_YEAR_MIN) / YEAR_RANGE) * TREE_HEIGHT;
}

export default function NarrativeTree({ activePeriodId, onPeriodChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isAutoScrolling = useRef(false);
  const selfTriggered = useRef(false);
  const currentPeriodRef = useRef(activePeriodId);
  currentPeriodRef.current = activePeriodId;

  const activePeriod = useMemo(
    () => NARRATIVE_PERIODS.find(p => p.id === activePeriodId),
    [activePeriodId]
  );

  // Nodes grouped by lane
  const nodesByLane = useMemo(() => {
    const map: Record<string, LineageNode[]> = { crown: [], lancaster: [], cornwall: [] };
    for (const node of LINEAGE_NODES) {
      map[node.lane].push(node);
    }
    return map;
  }, []);

  // SVG paths for cross-lane links
  const crossLaneLinks = useMemo(() => {
    return LINEAGE_LINKS.filter(link => {
      const from = LINEAGE_NODES.find(n => n.id === link.from);
      const to = LINEAGE_NODES.find(n => n.id === link.to);
      return from && to && from.lane !== to.lane;
    }).map(link => {
      const from = LINEAGE_NODES.find(n => n.id === link.from)!;
      const to = LINEAGE_NODES.find(n => n.id === link.to)!;
      const fromLaneIdx = LANES.indexOf(from.lane);
      const toLaneIdx = LANES.indexOf(to.lane);
      // X positions: each lane is 33.3% wide, center at (idx + 0.5) * 33.3%
      const x1 = (fromLaneIdx + 0.5) * (100 / 3);
      const x2 = (toLaneIdx + 0.5) * (100 / 3);
      const y1 = yPx(from.yearEnd);
      const y2 = yPx(to.yearStart);
      const midY = (y1 + y2) / 2;
      return { ...link, from: from, to: to, x1, x2, y1, y2, midY };
    });
  }, []);

  // Auto-scroll to active period nodes — but skip if the tree itself triggered the change
  useEffect(() => {
    if (selfTriggered.current) {
      selfTriggered.current = false;
      return;
    }
    const activeNode = LINEAGE_NODES.find(n => n.periodId === activePeriodId);
    if (!activeNode) return;
    const el = activeNodeRefs.current[activeNode.id];
    if (el) {
      isAutoScrolling.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { isAutoScrolling.current = false; }, 800);
    }
  }, [activePeriodId]);

  // Detect active period from manual tree scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      if (!el || isAutoScrolling.current || !onPeriodChange) return;
      const max = el.scrollHeight - el.clientHeight;
      const t = max > 0 ? el.scrollTop / max : 0;
      // Slide the reference point: near top-edge when scrolled up, center in middle, near bottom-edge when scrolled down
      const bias = 0.1 + t * 0.8;
      const refPx = el.scrollTop + el.clientHeight * bias;
      // Build reference points from nodes + period start years (fills gaps where periods have no early nodes)
      let closestPeriodId = NARRATIVE_PERIODS[0].id;
      let closestDist = Infinity;
      for (const node of LINEAGE_NODES) {
        const dist = Math.abs(yPx((node.yearStart + node.yearEnd) / 2) - refPx);
        if (dist < closestDist) { closestDist = dist; closestPeriodId = node.periodId; }
      }
      for (const period of NARRATIVE_PERIODS) {
        const dist = Math.abs(yPx(period.yearStart) - refPx);
        if (dist < closestDist) { closestDist = dist; closestPeriodId = period.id; }
      }
      // Only trigger if the period actually changed
      if (closestPeriodId !== currentPeriodRef.current) {
        selfTriggered.current = true;
        onPeriodChange(closestPeriodId);
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [onPeriodChange]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-950 pt-10">
      {/* Lane headers */}
      <div className="flex-shrink-0 grid grid-cols-3 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm z-10">
        {LANES.map(lane => (
          <div key={lane} className="flex items-center justify-center gap-1.5 py-2 px-1">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: LANE_COLORS[lane] }}
            />
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 truncate">
              {LANE_LABELS[lane]}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable tree */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none relative">
        <div className="relative" style={{ height: TOTAL_HEIGHT }}>
          {/* Period background bands */}
          {NARRATIVE_PERIODS.map((period, periodIdx) => {
            const isFirst = periodIdx === 0;
            const isLast = periodIdx === NARRATIVE_PERIODS.length - 1;
            const top = isFirst ? 0 : yPx(period.yearStart);
            const height = (isLast ? TOTAL_HEIGHT : yPx(period.yearEnd)) - top;
            const isActive = period.id === activePeriodId;
            return (
              <div
                key={period.id}
                className={`absolute left-0 right-0 border-t border-gray-200 dark:border-gray-800 transition-colors duration-500 ${
                  isActive ? 'bg-white/80 dark:bg-gray-900/60' : ''
                }`}
                style={{ top, height }}
              >
                {/* Period year label on left edge */}
                <span className={`absolute left-1 top-1 text-[10px] font-mono tabular-nums transition-opacity ${
                  isActive ? 'text-gray-500 dark:text-gray-400 opacity-100' : 'text-gray-300 dark:text-gray-700 opacity-60'
                }`}>
                  {period.yearStart}
                </span>
              </div>
            );
          })}

          {/* Lane vertical lines */}
          {LANES.map((lane, i) => (
            <div
              key={lane}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${(i + 0.5) * (100 / 3)}%`,
                backgroundColor: LANE_COLORS[lane],
                opacity: 0.15,
              }}
            />
          ))}

          {/* Cross-lane SVG connections */}
          <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: TOTAL_HEIGHT }}>
            {crossLaneLinks.map((link, i) => {
              const isActive = link.from.periodId === activePeriodId || link.to.periodId === activePeriodId;
              return (
                <g key={i}>
                  <path
                    d={`M ${link.x1}% ${link.y1} C ${link.x1}% ${link.midY}, ${link.x2}% ${link.midY}, ${link.x2}% ${link.y2}`}
                    fill="none"
                    stroke={LANE_COLORS[link.to.lane]}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={link.type === 'conquest' || link.type === 'merger' ? '6,3' : undefined}
                    opacity={isActive ? 0.7 : 0.2}
                    className="transition-opacity duration-500"
                  />
                  {/* Link label */}
                  {link.label && isActive && (
                    <text
                      x={`${(parseFloat(String(link.x1)) + parseFloat(String(link.x2))) / 2}%`}
                      y={link.midY}
                      textAnchor="middle"
                      className="fill-gray-500 dark:fill-gray-400"
                      fontSize={9}
                      fontStyle="italic"
                    >
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node cards by lane */}
          {LANES.map((lane, laneIdx) => (
            <div key={lane}>
              {nodesByLane[lane].map((node, nodeIdx) => {
                const isActive = node.periodId === activePeriodId;
                const prevNode = nodesByLane[lane][nodeIdx - 1];
                const top = yPx(node.yearStart);
                const laneCenter = (laneIdx + 0.5) * (100 / 3);

                return (
                  <div key={node.id}>
                    {/* Same-lane connection line to previous node */}
                    {prevNode && (
                      <div
                        className="absolute w-px transition-opacity duration-500"
                        style={{
                          left: `${laneCenter}%`,
                          top: yPx(prevNode.yearEnd),
                          height: top - yPx(prevNode.yearEnd),
                          backgroundColor: LANE_COLORS[lane],
                          opacity: isActive || prevNode.periodId === activePeriodId ? 0.5 : 0.12,
                        }}
                      />
                    )}

                    {/* Node card */}
                    <div
                      ref={el => { activeNodeRefs.current[node.id] = el; }}
                      className={`absolute -translate-x-1/2 transition-all duration-500 ${
                        isActive
                          ? 'opacity-100 scale-105 z-10'
                          : 'opacity-35 scale-100'
                      }`}
                      style={{
                        left: `${laneCenter}%`,
                        top,
                      }}
                    >
                      {/* Dot */}
                      <div
                        className={`mx-auto rounded-full border-2 border-white dark:border-gray-900 shadow-sm ${
                          isActive ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'
                        }`}
                        style={{ backgroundColor: LANE_COLORS[lane] }}
                      />
                      {/* Label */}
                      <div className={`mt-1 text-center ${isActive ? 'max-w-[140px]' : 'max-w-[120px]'}`}>
                        <div className={`font-semibold truncate ${
                          isActive ? 'text-xs text-gray-900 dark:text-gray-100' : 'text-[10px] text-gray-500 dark:text-gray-500'
                        }`}>
                          {node.name}
                        </div>
                        <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                          {node.years}
                        </div>
                        {isActive && node.note && (
                          <div className="text-[9px] text-gray-500 dark:text-gray-400 italic mt-0.5 truncate">
                            {node.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Merger annotation: Henry IV (1399) */}
          {activePeriodId === 'crown-duchy-merge' && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded px-2 py-1 text-[10px] text-orange-700 dark:text-orange-300 text-center z-20 whitespace-nowrap"
              style={{ top: yPx(1399) - 30 }}
            >
              Lancaster merges into Crown (1399)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
