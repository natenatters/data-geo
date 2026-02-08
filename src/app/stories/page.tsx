'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ERAS } from '@/lib/types';
import type { Era, Story } from '@/lib/types';

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    fetch('/api/stories').then(r => r.json()).then(setStories);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
        <span className="text-sm text-gray-500">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
      </div>

      <div className="space-y-2">
        {stories.map(story => {
          const yearRange = story.year_end && story.year_end !== story.year_start
            ? `${story.year_start}–${story.year_end}`
            : `${story.year_start}`;

          return (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-medium text-gray-900 group-hover:text-purple-700 truncate">
                    {story.title}
                  </h2>
                  {story.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{story.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                    style={{ backgroundColor: ERAS[story.era as Era]?.color || '#6b7280' }}
                  >
                    {ERAS[story.era as Era]?.label || story.era}
                  </span>
                  <span className="text-xs text-gray-400">{yearRange}</span>
                </div>
              </div>
              {story.source_ids.length > 0 && (
                <div className="text-[10px] text-gray-400 mt-1.5">
                  {story.source_ids.length} linked source{story.source_ids.length !== 1 ? 's' : ''}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {stories.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-12">
          No stories yet. Add stories as JSON files in the <code className="bg-gray-100 px-1 rounded">stories/</code> directory.
        </div>
      )}
    </div>
  );
}
