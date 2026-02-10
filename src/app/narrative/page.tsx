'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { NARRATIVE_PERIODS } from '@/lib/narrative-periods';
import NarrativeSection from '@/components/NarrativeSection';

const NarrativeMap = dynamic(() => import('@/components/NarrativeMap'), { ssr: false });

export default function NarrativePage() {
  const [activePeriodId, setActivePeriodId] = useState(NARRATIVE_PERIODS[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const setSectionRef = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
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

    // Slight delay to ensure refs are populated after render
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

  return (
    <div className="fixed inset-0 top-14 z-0">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left: Sticky map */}
        <div className="h-[40vh] lg:h-full lg:w-1/2 flex-shrink-0">
          <NarrativeMap activePeriodId={activePeriodId} />
        </div>

        {/* Right: Scrollable narrative with sticky header */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950">
          {/* Sticky period nav bar */}
          <div className="flex-shrink-0 sticky top-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            {(() => {
              const active = NARRATIVE_PERIODS.find(p => p.id === activePeriodId);
              return (
                <div className="px-4 sm:px-6 py-2">
                  {/* Active period title */}
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                      {active?.yearStart}&ndash;{active?.yearEnd}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {active?.title}
                    </span>
                  </div>
                  {/* Period jump buttons */}
                  <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    {NARRATIVE_PERIODS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const el = sectionRefs.current[p.id];
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-2 py-0.5 text-xs rounded whitespace-nowrap transition-colors flex-shrink-0 ${
                          activePeriodId === p.id
                            ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {p.yearStart}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Scrollable content */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto"
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
        </div>
      </div>
    </div>
  );
}
