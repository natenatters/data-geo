'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { NARRATIVE_PERIODS } from '@/lib/narrative-periods';
import NarrativeSection from '@/components/NarrativeSection';

const NarrativeMap = dynamic(() => import('@/components/NarrativeMap'), { ssr: false });
const NarrativeTree = dynamic(() => import('@/components/NarrativeTree'), { ssr: false });

// Proportional positions for the timeline sidebar (0-1)
const TIMELINE_ITEMS = (() => {
  const minYear = NARRATIVE_PERIODS[0].yearStart;
  const maxYear = NARRATIVE_PERIODS[NARRATIVE_PERIODS.length - 1].yearStart;
  const range = maxYear - minYear;
  return NARRATIVE_PERIODS.map(p => ({
    id: p.id,
    yearStart: p.yearStart,
    title: p.title,
    fraction: (p.yearStart - minYear) / range,
  }));
})();

// Parse hash: "#period-id:scrollPct:viewMode"
function parseHash(): { id: string; scrollPct: number; view: 'map' | 'tree' } {
  const fallback = { id: NARRATIVE_PERIODS[0].id, scrollPct: 0, view: 'map' as const };
  if (typeof window === 'undefined') return fallback;
  const raw = window.location.hash.slice(1);
  if (!raw) return fallback;
  const [id, pctStr, viewStr] = raw.split(':');
  const valid = NARRATIVE_PERIODS.some(p => p.id === id);
  return {
    id: valid ? id : fallback.id,
    scrollPct: pctStr ? parseInt(pctStr, 10) || 0 : 0,
    view: viewStr === 'tree' ? 'tree' : 'map',
  };
}

export default function NarrativePage() {
  const [activePeriodId, setActivePeriodId] = useState(NARRATIVE_PERIODS[0].id);
  const [viewMode, setViewMode] = useState<'map' | 'tree'>('map');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const isTreeDriving = useRef(false);
  const treeDriveTimer = useRef<ReturnType<typeof setTimeout>>();

  const setSectionRef = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  const activePeriod = useMemo(
    () => NARRATIVE_PERIODS.find(p => p.id === activePeriodId),
    [activePeriodId]
  );

  const [scrollProgress, setScrollProgress] = useState(0);
  const activeFraction = TIMELINE_ITEMS.find(t => t.id === activePeriodId)?.fraction ?? 0;
  const sidebarProgress = viewMode === 'tree' ? activeFraction : scrollProgress;

  function scrollTo(id: string) {
    setActivePeriodId(id);
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  // When tree scroll changes the visible period, sync text panel
  function handleTreePeriodChange(periodId: string) {
    if (periodId === activePeriodId) return;
    isTreeDriving.current = true;
    setActivePeriodId(periodId);
    const el = sectionRefs.current[periodId];
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    clearTimeout(treeDriveTimer.current);
    treeDriveTimer.current = setTimeout(() => { isTreeDriving.current = false; }, 800);
  }

  // Update URL hash with period + scroll progress + view mode (debounced)
  const hashTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(hashTimer.current);
    hashTimer.current = setTimeout(() => {
      const pct = Math.round(scrollProgress * 1000);
      const suffix = viewMode === 'tree' ? ':tree' : '';
      window.history.replaceState(null, '', `#${activePeriodId}:${pct}${suffix}`);
    }, 300);
    return () => clearTimeout(hashTimer.current);
  }, [activePeriodId, scrollProgress, viewMode]);

  // On mount, restore period + scroll position + view mode from hash
  useEffect(() => {
    const { id, scrollPct, view } = parseHash();
    if (id !== NARRATIVE_PERIODS[0].id) setActivePeriodId(id);
    if (view === 'tree') setViewMode('tree');
    if (scrollPct > 0) {
      const timer = setTimeout(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        el.scrollTop = (scrollPct / 1000) * max;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // Track continuous scroll progress (0-1) for the sidebar thumb
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? el.scrollTop / max : 0);
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Intersection Observer for scroll-map sync
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-period-id');
          if (id && !isTreeDriving.current) setActivePeriodId(id);
        }
      },
      {
        root: scrollContainer,
        rootMargin: '-40% 0px -40% 0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      }
    );

    const timer = setTimeout(() => {
      Object.values(sectionRefs.current).forEach(el => {
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Keyboard navigation: up/down arrows jump between periods
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const idx = NARRATIVE_PERIODS.findIndex(p => p.id === activePeriodId);
      const next = e.key === 'ArrowDown'
        ? Math.min(idx + 1, NARRATIVE_PERIODS.length - 1)
        : Math.max(idx - 1, 0);
      if (next !== idx) scrollTo(NARRATIVE_PERIODS[next].id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePeriodId]);

  // Sidebar track inset (rem) and thumb position
  const TRACK_INSET = 1.5; // rem from top/bottom
  const TRACK_INSET_TOTAL = TRACK_INSET * 2;

  return (
    <div className="fixed inset-0 top-14 z-0">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left: Map or Tree view */}
        <div className="h-[60vh] lg:h-full lg:w-1/2 flex-shrink-0 relative">
          {viewMode === 'map' ? (
            <NarrativeMap activePeriodId={activePeriodId} />
          ) : (
            <NarrativeTree activePeriodId={activePeriodId} onPeriodChange={handleTreePeriodChange} />
          )}

          {/* View toggle — overlaid top-left */}
          <div className="absolute top-3 left-3 z-20 flex bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Lineage
            </button>
          </div>
        </div>

        {/* Right: Header + Content + Timeline sidebar */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950">
          {/* Sticky period header with nav arrows */}
          {(() => {
            const idx = NARRATIVE_PERIODS.findIndex(p => p.id === activePeriodId);
            const hasPrev = idx > 0;
            const hasNext = idx < NARRATIVE_PERIODS.length - 1;
            return (
              <div className="flex-shrink-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => hasPrev && scrollTo(NARRATIVE_PERIODS[idx - 1].id)}
                    disabled={!hasPrev}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 shrink-0 -ml-1 px-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                    {activePeriod?.yearStart}&ndash;{activePeriod?.yearEnd}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate flex-1">
                    {activePeriod?.title}
                  </span>
                  <button
                    onClick={() => hasNext && scrollTo(NARRATIVE_PERIODS[idx + 1].id)}
                    disabled={!hasNext}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:invisible shrink-0 px-0.5 -mr-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Content + sidebar row */}
          <div className="flex-1 flex min-h-0">
            {/* Scrollable content — native scrollbar hidden */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto scrollbar-none"
            >
              {/* Intro section */}
              <div className="px-6 sm:px-10 pt-10 pb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  Crown, Duchy &amp; Title
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-3 max-w-xl">
                  How royal power, land, and terminology evolved across England from
                  the Anglo-Saxons to today &mdash; and what it all means for Manchester.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
                  Scroll down to begin. The map will update as you read.
                </p>
                {/* Animated scroll hint */}
                <div className="mt-8 flex justify-center animate-bounce">
                  <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* Period sections */}
              {NARRATIVE_PERIODS.map(period => (
                <NarrativeSection
                  key={period.id}
                  period={period}
                  isActive={activePeriodId === period.id}
                  ref={setSectionRef(period.id)}
                />
              ))}

              {/* Closing section */}
              <div className="px-6 sm:px-10 py-16 border-t border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  The Full Picture
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-xl leading-relaxed">
                  Three separate structures of royal property, each with different
                  governance: the Crown Estate (managed for the public, revenue to
                  Treasury), the Duchy of Lancaster (the sovereign&apos;s private estate),
                  and the Duchy of Cornwall (the heir&apos;s private estate).
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-xl leading-relaxed">
                  Manchester&apos;s connection runs through the Duchy of Lancaster &mdash;
                  a relationship that stretches back to 1267 and continues, in
                  evolved form, to this day.
                </p>
              </div>
            </div>

            {/* Floating "Back to top" pill — shows when scrolled past 80% */}
            {scrollProgress > 0.8 && (
              <button
                onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 lg:right-16 z-30 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-4 py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                Top &uarr;
              </button>
            )}

            {/* Timeline sidebar — desktop only */}
            <div className="hidden lg:block w-10 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 relative">
              {/* Track line (background) */}
              <div className="absolute left-1/2 -translate-x-px top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-800" />

              {/* Track line (progress fill — follows scroll) */}
              <div
                className={`absolute left-1/2 -translate-x-px top-6 w-0.5 bg-gray-400 dark:bg-gray-500 ${viewMode === 'tree' ? 'transition-[height] duration-500' : ''}`}
                style={{
                  height: `calc(${sidebarProgress * 100}% - ${sidebarProgress * TRACK_INSET_TOTAL}rem)`,
                }}
              />

              {/* Scroll thumb — moves continuously */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-900 dark:bg-gray-100 shadow-md border-2 border-white dark:border-gray-900 z-20 pointer-events-none ${viewMode === 'tree' ? 'transition-[top] duration-500' : ''}`}
                style={{
                  top: `calc(${TRACK_INSET - sidebarProgress * TRACK_INSET_TOTAL}rem + ${sidebarProgress * 100}%)`,
                }}
              />

              {/* Year waypoint markers */}
              {TIMELINE_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  title={`${item.yearStart} — ${item.title}`}
                  className="absolute left-1/2 -translate-x-1/2 group flex items-center z-10"
                  style={{
                    top: `calc(${TRACK_INSET - item.fraction * TRACK_INSET_TOTAL}rem + ${item.fraction * 100}%)`,
                  }}
                >
                  {/* Waypoint tick */}
                  <div
                    className={`rounded-full transition-all ${
                      activePeriodId === item.id
                        ? 'w-2.5 h-2.5 bg-gray-900 dark:bg-gray-100'
                        : 'w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 group-hover:bg-gray-600 dark:group-hover:bg-gray-400'
                    }`}
                  />

                  {/* Year label on hover / active */}
                  <span
                    className={`absolute right-full mr-2 px-2 py-0.5 rounded text-[10px] font-mono tabular-nums whitespace-nowrap transition-opacity pointer-events-none ${
                      activePeriodId === item.id
                        ? 'opacity-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                        : 'opacity-0 group-hover:opacity-100 bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900'
                    }`}
                  >
                    {item.yearStart}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
