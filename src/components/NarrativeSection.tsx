'use client';

import { forwardRef } from 'react';
import type { NarrativePeriod } from '@/lib/narrative-periods';

interface Props {
  period: NarrativePeriod;
  isActive: boolean;
}

const NarrativeSection = forwardRef<HTMLElement, Props>(
  function NarrativeSection({ period, isActive }, ref) {
    const paragraphs = period.narrative.split('\n\n').filter(Boolean);

    return (
      <section
        ref={ref}
        data-period-id={period.id}
        className={`min-h-screen transition-opacity duration-500 ${
          isActive ? 'opacity-100' : 'opacity-60'
        }`}
      >
        {/* Section body */}
        <div className="px-6 sm:px-10 pt-10 pb-10">
          {/* Section heading */}
          <div className="mb-6 border-l-4 border-gray-300 dark:border-gray-600 pl-4">
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 tabular-nums">
              {period.yearStart}&ndash;{period.yearEnd}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {period.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {period.subtitle}
            </p>
          </div>

          {/* Narrative prose */}
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {/* Key entities */}
          {period.keyEntities.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                Key Figures
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {period.keyEntities.map((entity, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900"
                  >
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {entity.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {entity.role}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                      {entity.holds}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Glossary */}
          {period.glossary.length > 0 && (
            <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                Key Terms for this Period
              </h3>
              <dl className="space-y-3">
                {period.glossary.map((entry, i) => (
                  <div key={i}>
                    <dt className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {entry.term}
                    </dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {entry.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>
    );
  }
);

export default NarrativeSection;
