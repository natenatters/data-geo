#!/usr/bin/env node
/**
 * Prebuild script: reads sources/ and stories/ directories,
 * generates static JSON files in public/data/ for the static export.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SOURCES_DIR = path.join(ROOT, 'sources');
const STORIES_DIR = path.join(ROOT, 'stories');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, 'public', 'data');

fs.mkdirSync(OUT_DIR, { recursive: true });

// --- Read sources ---
function readSources() {
  if (!fs.existsSync(SOURCES_DIR)) return [];
  return fs.readdirSync(SOURCES_DIR)
    .filter(f => f.endsWith('.json') && !fs.statSync(path.join(SOURCES_DIR, f)).isDirectory())
    .sort((a, b) => {
      const idA = parseInt(a.split('-')[0]);
      const idB = parseInt(b.split('-')[0]);
      return idA - idB;
    })
    .map(f => {
      const raw = fs.readFileSync(path.join(SOURCES_DIR, f), 'utf-8');
      const record = JSON.parse(raw);
      // Strip files array (not needed for static site)
      const { files, ...source } = record;
      return source;
    });
}

// --- Read stories ---
function readStories() {
  if (!fs.existsSync(STORIES_DIR)) return [];
  return fs.readdirSync(STORIES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => {
      const idA = parseInt(a.split('-')[0]);
      const idB = parseInt(b.split('-')[0]);
      return idA - idB;
    })
    .map(f => {
      const raw = fs.readFileSync(path.join(STORIES_DIR, f), 'utf-8');
      const story = JSON.parse(raw);
      // Resolve content from content_file if needed
      if (!story.content && story.content_file) {
        const filePath = path.join(DATA_DIR, story.content_file);
        if (fs.existsSync(filePath)) {
          story.resolvedContent = fs.readFileSync(filePath, 'utf-8');
        }
      } else if (story.content) {
        story.resolvedContent = story.content;
      }
      return story;
    });
}

// --- Bucket helpers (mirrored from store.ts) ---
const BUCKET_RANGES = [
  { start: 0, end: 1500, size: 100 },
  { start: 1500, end: 1750, size: 50 },
  { start: 1750, end: 1900, size: 25 },
  { start: 1900, end: 2100, size: 10 },
];

function getBucketStart(year) {
  for (const range of BUCKET_RANGES) {
    if (year < range.end) {
      return Math.floor(year / range.size) * range.size;
    }
  }
  return Math.floor(year / 10) * 10;
}

function getBucketSize(year) {
  for (const range of BUCKET_RANGES) {
    if (year < range.end) return range.size;
  }
  return 10;
}

// --- Compute stats (mirrored from store.ts getStats) ---
function computeStats(sources, stories) {
  const byStage = {};
  const byEra = {};
  const byType = {};

  for (const s of sources) {
    byStage[s.stage] = (byStage[s.stage] || 0) + 1;
    byEra[s.era] = (byEra[s.era] || 0) + 1;
    byType[s.source_type] = (byType[s.source_type] || 0) + 1;
  }

  const eraOrder = ['roman', 'medieval', 'industrial', 'victorian', 'modern'];
  const dated = sources.filter(s => s.year_start != null);
  const undated = sources.filter(s => s.year_start == null);
  const timelineDated = dated.filter(s => s.stage > 1);

  const bucketMap = new Map();

  for (const s of timelineDated) {
    const bStart = getBucketStart(s.year_start);
    const bSize = getBucketSize(s.year_start);
    if (!bucketMap.has(bStart)) {
      bucketMap.set(bStart, { start: bStart, end: bStart + bSize, sources: [], stories: [] });
    }
    bucketMap.get(bStart).sources.push({
      id: s.id, name: s.name, year_start: s.year_start,
      era: s.era, stage: s.stage, source_type: s.source_type,
    });
  }

  for (const story of stories) {
    const bStart = getBucketStart(story.year_start);
    const bSize = getBucketSize(story.year_start);
    if (!bucketMap.has(bStart)) {
      bucketMap.set(bStart, { start: bStart, end: bStart + bSize, sources: [], stories: [] });
    }
    bucketMap.get(bStart).stories.push({
      id: story.id, title: story.title,
      year_start: story.year_start, era: story.era,
    });
  }

  const buckets = Array.from(bucketMap.values()).sort((a, b) => a.start - b.start);

  return {
    total: sources.length,
    storyTotal: stories.length,
    byStage: Object.entries(byStage)
      .map(([stage, count]) => ({ stage: parseInt(stage), count }))
      .sort((a, b) => a.stage - b.stage),
    byEra: Object.entries(byEra)
      .map(([era, count]) => ({ era, count }))
      .sort((a, b) => eraOrder.indexOf(a.era) - eraOrder.indexOf(b.era)),
    byType: Object.entries(byType)
      .map(([source_type, count]) => ({ source_type, count })),
    buckets,
    undated: undated.map(s => ({
      id: s.id, name: s.name, era: s.era,
      stage: s.stage, source_type: s.source_type,
    })),
  };
}

// --- Export config (mirrored from export API) ---
function computeExportConfig(sources) {
  const stage4 = sources.filter(s => s.stage === 4);
  const imagery = stage4
    .filter(s => s.source_type === 'map_overlay')
    .map(s => ({
      id: s.id, name: s.name, era: s.era,
      yearStart: s.year_start, yearEnd: s.year_end,
      tiles: s.tiles,
      bounds: s.bounds_west != null ? {
        west: s.bounds_west, south: s.bounds_south,
        east: s.bounds_east, north: s.bounds_north,
      } : null,
    }));
  const vectors = stage4
    .filter(s => s.source_type === 'vector_features')
    .map(s => ({
      id: s.id, name: s.name, era: s.era,
      yearStart: s.year_start, yearEnd: s.year_end,
      bounds: s.bounds_west != null ? {
        west: s.bounds_west, south: s.bounds_south,
        east: s.bounds_east, north: s.bounds_north,
      } : null,
    }));
  return { imagery, vectors, generated: new Date().toISOString() };
}

// --- Run ---
const sources = readSources();
const stories = readStories();
const stats = computeStats(sources, stories);
const exportConfig = computeExportConfig(sources);

fs.writeFileSync(path.join(OUT_DIR, 'sources.json'), JSON.stringify(sources, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'stories.json'), JSON.stringify(stories, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'stats.json'), JSON.stringify(stats, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'export-config.json'), JSON.stringify(exportConfig, null, 2));

console.log(`Prebuild complete:`);
console.log(`  ${sources.length} sources → public/data/sources.json`);
console.log(`  ${stories.length} stories → public/data/stories.json`);
console.log(`  stats → public/data/stats.json`);
console.log(`  export config → public/data/export-config.json`);
