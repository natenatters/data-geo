'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ERAS } from '@/lib/types';
import type { Era, Story } from '@/lib/types';

interface StoryWithContent extends Story {
  resolvedContent: string | null;
}

interface LinkedSource {
  id: number;
  name: string;
  era: string;
  year_start: number | null;
}

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [story, setStory] = useState<StoryWithContent | null>(null);
  const [linkedSources, setLinkedSources] = useState<LinkedSource[]>([]);

  useEffect(() => {
    fetch(`/api/stories/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data: StoryWithContent) => {
        setStory(data);
        // Fetch linked sources
        if (data.source_ids.length > 0) {
          fetch('/api/sources')
            .then(r => r.json())
            .then((sources: LinkedSource[]) => {
              setLinkedSources(sources.filter(s => data.source_ids.includes(s.id)));
            });
        }
      })
      .catch(() => router.push('/stories'));
  }, [id, router]);

  if (!story) {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  const yearRange = story.year_end && story.year_end !== story.year_start
    ? `${story.year_start}–${story.year_end}`
    : `${story.year_start}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/stories" className="text-xs text-gray-400 hover:text-gray-600">
            Stories
          </Link>
          <span className="text-xs text-gray-300">/</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{story.title}</h1>
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span
            className="px-1.5 py-0.5 rounded font-medium text-white"
            style={{ backgroundColor: ERAS[story.era as Era]?.color || '#6b7280' }}
          >
            {ERAS[story.era as Era]?.label || story.era}
          </span>
          <span className="text-gray-500">{yearRange}</span>
        </div>
      </div>

      {/* Description */}
      {story.description && (
        <p className="text-sm text-gray-600">{story.description}</p>
      )}

      {/* Linked sources */}
      {linkedSources.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Linked Sources
            <span className="text-gray-400 font-normal ml-1.5">({linkedSources.length})</span>
          </h2>
          <div className="space-y-1">
            {linkedSources.map(s => (
              <Link
                key={s.id}
                href={`/sources/${s.id}`}
                className="flex items-center gap-2 py-1.5 px-2 -mx-1 rounded hover:bg-gray-50 group"
              >
                <span
                  className="px-1 py-0.5 rounded text-[10px] font-medium text-white shrink-0"
                  style={{ backgroundColor: ERAS[s.era as Era]?.color || '#6b7280' }}
                >
                  {s.year_start || '?'}
                </span>
                <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-blue-600">
                  {s.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {story.resolvedContent && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Content</h2>
          <div className="text-sm text-gray-600 whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto">
            {story.resolvedContent}
          </div>
        </div>
      )}
    </div>
  );
}
