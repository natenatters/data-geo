'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { NARRATIVE_PERIODS } from '@/lib/narrative-periods';
import NarrativeSection from '@/components/NarrativeSection';

const NarrativeMap = dynamic(() => import('@/components/NarrativeMap'), { ssr: false });

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

// Parse hash: "#period-id:scrollPct" → { id, scrollPct (0-1000) }
function parseHash(): { id: string; scrollPct: number } {
  const fallback = { id: NARRATIVE_PERIODS[0].id, scrollPct: 0 };
  if (typeof window === 'undefined') return fallback;
  const raw = window.location.hash.slice(1);
  if (!raw) return fallback;
  const [id, pctStr] = raw.split(':');
  const valid = NARRATIVE_PERIODS.some(p => p.id === id);
  return {
    id: valid ? id : fallback.id,
    scrollPct: pctStr ? parseInt(pctStr, 10) || 0 : 0,
  };
}

export default function NarrativePage() {
  const [activePeriodId, setActivePeriodId] = useState(NARRATIVE_PERIODS[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const setSectionRef = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  const activePeriod = useMemo(
    () => NARRATIVE_PERIODS.find(p => p.id === activePeriodId),
    [activePeriodId]
  );

  const [scrollProgress, setScrollProgress] = useState(0);

  function scrollTo(id: string) {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  // Update URL hash with period + scroll progress (debounced to avoid thrashing)
  const hashTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(hashTimer.current);
    hashTimer.current = setTimeout(() => {
      const pct = Math.round(scrollProgress * 1000);
      window.history.replaceState(null, '', `#${activePeriodId}:${pct}`);
    }, 300);
    return () => clearTimeout(hashTimer.current);
  }, [activePeriodId, scrollProgress]);

  // On mount, restore period + scroll position from hash (after hydration)
  useEffect(() => {
    const { id, scrollPct } = parseHash();
    if (id !== NARRATIVE_PERIODS[0].id) setActivePeriodId(id);
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
          if (id) setActivePeriodId(id);
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

  // Sidebar track inset (rem) and thumb position
  const TRACK_INSET = 1.5; // rem from top/bottom
  const TRACK_INSET_TOTAL = TRACK_INSET * 2;

  return (
    <div className="fixed inset-0 top-14 z-0">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left: Sticky map */}
        <div className="h-[40vh] lg:h-full lg:w-1/2 flex-shrink-0">
          <NarrativeMap activePeriodId={activePeriodId} />
        </div>

        {/* Right: Header + Content + Timeline sidebar */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950">
          {/* Sticky period header */}
          <div className="flex-shrink-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                {activePeriod?.yearStart}&ndash;{activePeriod?.yearEnd}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {activePeriod?.title}
              </span>
            </div>
          </div>

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
                  Three pots of royal property, each with different rules: the Crown
                  Estate (public, revenue to Treasury), the Duchy of Lancaster (king&apos;s
                  private income), and the Duchy of Cornwall (heir&apos;s private income).
                  Everything else with &ldquo;Duke&rdquo; in the name is just a title with nothing
                  behind it.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-xl leading-relaxed">
                  Manchester&apos;s connection runs through the Duchy of Lancaster &mdash;
                  a relationship that stretches back to 1267 and persists, in diminished
                  form, to this day.
                </p>
              </div>
            </div>

            {/* Timeline sidebar — desktop only */}
            <div className="hidden lg:block w-10 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 relative">
              {/* Track line (background) */}
              <div className="absolute left-1/2 -translate-x-px top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-800" />

              {/* Track line (progress fill — follows scroll) */}
              <div
                className="absolute left-1/2 -translate-x-px top-6 w-0.5 bg-gray-400 dark:bg-gray-500"
                style={{
                  height: `calc(${scrollProgress * 100}% - ${scrollProgress * TRACK_INSET_TOTAL}rem)`,
                }}
              />

              {/* Scroll thumb — moves continuously */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-900 dark:bg-gray-100 shadow-md border-2 border-white dark:border-gray-900 z-20 pointer-events-none"
                style={{
                  top: `calc(${TRACK_INSET - scrollProgress * TRACK_INSET_TOTAL}rem + ${scrollProgress * 100}%)`,
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

        {/* Mobile: floating active period pill */}
        <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 tabular-nums">
            {activePeriod?.yearStart}
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 ml-2">
            {activePeriod?.title}
          </span>
        </div>
      </div>
    </div>
  );
}
