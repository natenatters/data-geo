import fs from 'fs';
import path from 'path';
import type { Source, SourceFile, SourceWithFiles, Story } from './types';

const SOURCES_DIR = path.join(process.cwd(), 'sources');
const META_DIR = path.join(process.cwd(), 'sources', 'meta');
const DATA_DIR = path.join(process.cwd(), 'data');
const STORIES_DIR = path.join(process.cwd(), 'stories');
const PERIOD_QUALITY_FILE = path.join(META_DIR, 'period-quality.json');

// Ensure dirs exist
fs.mkdirSync(SOURCES_DIR, { recursive: true });
fs.mkdirSync(META_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(STORIES_DIR, { recursive: true });

interface SourceRecord extends Source {
  files: SourceFile[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function listSourceFiles(): string[] {
  return fs.readdirSync(SOURCES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => {
      const idA = parseInt(a.split('-')[0]);
      const idB = parseInt(b.split('-')[0]);
      return idA - idB;
    });
}

function readSource(filename: string): SourceRecord {
  const raw = fs.readFileSync(path.join(SOURCES_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

function writeSource(record: SourceRecord): void {
  const slug = slugify(record.name);
  const filename = `${record.id}-${slug}.json`;

  // Remove old file if name changed (different slug)
  const existing = listSourceFiles().find(f => f.startsWith(`${record.id}-`));
  if (existing && existing !== filename) {
    fs.unlinkSync(path.join(SOURCES_DIR, existing));
  }

  fs.writeFileSync(
    path.join(SOURCES_DIR, filename),
    JSON.stringify(record, null, 2) + '\n'
  );
}

function nextId(): number {
  const files = listSourceFiles();
  if (files.length === 0) return 1;
  const ids = files.map(f => parseInt(f.split('-')[0]));
  return Math.max(...ids) + 1;
}

function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// Public API — mirrors the old db interface

export function getAllSources(filters?: {
  era?: string;
  stage?: string;
  source_type?: string;
  has_tiles?: string;
  sort?: string;
  order?: string;
}): Source[] {
  let sources = listSourceFiles().map(f => {
    const record = readSource(f);
    // Return without files array for list view
    const { files, ...source } = record;
    return source as Source;
  });

  if (filters?.era) {
    sources = sources.filter(s => s.era === filters.era);
  }
  if (filters?.stage) {
    sources = sources.filter(s => s.stage === parseInt(filters.stage!));
  }
  if (filters?.source_type) {
    sources = sources.filter(s => s.source_type === filters.source_type);
  }
  if (filters?.has_tiles === '1') {
    sources = sources.filter(s => s.tiles.length > 0);
  }

  const sortField = filters?.sort || 'year_start';
  const sortOrder = filters?.order === 'desc' ? -1 : 1;

  sources.sort((a, b) => {
    const aVal = a[sortField as keyof Source];
    const bVal = b[sortField as keyof Source];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return -1 * sortOrder;
    if (aVal > bVal) return 1 * sortOrder;
    return 0;
  });

  return sources;
}

export function getSource(id: number): SourceWithFiles | null {
  const file = listSourceFiles().find(f => f.startsWith(`${id}-`));
  if (!file) return null;
  return readSource(file);
}

export function createSource(data: Partial<Source>): Source {
  const id = nextId();
  const timestamp = now();

  const record: SourceRecord = {
    id,
    name: data.name || '',
    description: data.description || null,
    source_url: data.source_url || null,
    source_type: data.source_type || 'map_overlay',
    stage: data.stage || 1,
    year_start: data.year_start || null,
    year_end: data.year_end || null,
    era: data.era || 'modern',
    bounds_west: data.bounds_west || null,
    bounds_south: data.bounds_south || null,
    bounds_east: data.bounds_east || null,
    bounds_north: data.bounds_north || null,
    notes: data.notes || null,
    iiif_url: data.iiif_url || null,
    georeference_url: data.georeference_url || null,
    tiles: data.tiles || [],
    created_at: timestamp,
    updated_at: timestamp,
    files: [],
  };

  writeSource(record);
  const { files, ...source } = record;
  return source as Source;
}

export function updateSource(id: number, data: Partial<Source>): Source | null {
  const existing = getSource(id);
  if (!existing) return null;

  const updated: SourceRecord = {
    ...existing,
    ...data,
    id, // ensure id doesn't change
    updated_at: now(),
  };

  writeSource(updated);
  const { files, ...source } = updated;
  return source as Source;
}

export function deleteSource(id: number): boolean {
  const file = listSourceFiles().find(f => f.startsWith(`${id}-`));
  if (!file) return false;

  // Delete associated data files
  const record = readSource(file);
  for (const f of record.files) {
    const fullPath = path.join(DATA_DIR, f.filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  fs.unlinkSync(path.join(SOURCES_DIR, file));
  return true;
}

export function addFile(sourceId: number, fileData: {
  filename: string;
  filepath: string;
  filetype: string;
}): SourceFile | null {
  const source = getSource(sourceId);
  if (!source) return null;

  const maxFileId = source.files.length > 0
    ? Math.max(...source.files.map(f => f.id))
    : 0;

  const newFile: SourceFile = {
    id: maxFileId + 1,
    source_id: sourceId,
    filename: fileData.filename,
    filepath: fileData.filepath,
    filetype: fileData.filetype as SourceFile['filetype'],
    created_at: now(),
  };

  source.files.push(newFile);
  writeSource(source);
  return newFile;
}

export function deleteFile(sourceId: number, fileId: number): boolean {
  const source = getSource(sourceId);
  if (!source) return false;

  const fileIndex = source.files.findIndex(f => f.id === fileId);
  if (fileIndex === -1) return false;

  const file = source.files[fileIndex];
  const fullPath = path.join(DATA_DIR, file.filepath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  source.files.splice(fileIndex, 1);
  writeSource(source);
  return true;
}

// Adaptive bucket sizes: wider for sparse early periods, narrower for dense recent ones
const BUCKET_RANGES: { start: number; end: number; size: number }[] = [
  { start: 0, end: 1500, size: 100 },    // centuries for pre-1500
  { start: 1500, end: 1750, size: 50 },   // half-centuries
  { start: 1750, end: 1900, size: 25 },   // quarter-centuries for industrial/victorian
  { start: 1900, end: 2100, size: 10 },   // decades for modern
];

function getBucketStart(year: number): number {
  for (const range of BUCKET_RANGES) {
    if (year < range.end) {
      return Math.floor(year / range.size) * range.size;
    }
  }
  return Math.floor(year / 10) * 10;
}

function getBucketSize(year: number): number {
  for (const range of BUCKET_RANGES) {
    if (year < range.end) return range.size;
  }
  return 10;
}

export function getStats() {
  const sources = getAllSources();
  const stories = getAllStories();

  const byStage: Record<number, number> = {};
  const byEra: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const s of sources) {
    byStage[s.stage] = (byStage[s.stage] || 0) + 1;
    byEra[s.era] = (byEra[s.era] || 0) + 1;
    byType[s.source_type] = (byType[s.source_type] || 0) + 1;
  }

  const eraOrder = ['roman', 'medieval', 'industrial', 'victorian', 'modern'];

  const dated = sources.filter(s => s.year_start != null);
  const undated = sources.filter(s => s.year_start == null);

  // Build bucketed timeline data
  const bucketMap = new Map<number, {
    start: number;
    end: number;
    sources: { id: number; name: string; year_start: number; era: string; stage: number; source_type: string }[];
    stories: { id: number; title: string; year_start: number; era: string }[];
  }>();

  for (const s of dated) {
    const bStart = getBucketStart(s.year_start!);
    const bSize = getBucketSize(s.year_start!);
    if (!bucketMap.has(bStart)) {
      bucketMap.set(bStart, { start: bStart, end: bStart + bSize, sources: [], stories: [] });
    }
    bucketMap.get(bStart)!.sources.push({
      id: s.id,
      name: s.name,
      year_start: s.year_start!,
      era: s.era,
      stage: s.stage,
      source_type: s.source_type,
    });
  }

  for (const story of stories) {
    const bStart = getBucketStart(story.year_start);
    const bSize = getBucketSize(story.year_start);
    if (!bucketMap.has(bStart)) {
      bucketMap.set(bStart, { start: bStart, end: bStart + bSize, sources: [], stories: [] });
    }
    bucketMap.get(bStart)!.stories.push({
      id: story.id,
      title: story.title,
      year_start: story.year_start,
      era: story.era,
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
      id: s.id,
      name: s.name,
      era: s.era,
      stage: s.stage,
      source_type: s.source_type,
    })),
  };
}

// --- Stories ---

function listStoryFiles(): string[] {
  return fs.readdirSync(STORIES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => {
      const idA = parseInt(a.split('-')[0]);
      const idB = parseInt(b.split('-')[0]);
      return idA - idB;
    });
}

function readStory(filename: string): Story {
  const raw = fs.readFileSync(path.join(STORIES_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

function writeStory(record: Story): void {
  const slug = slugify(record.title);
  const filename = `${record.id}-${slug}.json`;

  const existing = listStoryFiles().find(f => f.startsWith(`${record.id}-`));
  if (existing && existing !== filename) {
    fs.unlinkSync(path.join(STORIES_DIR, existing));
  }

  fs.writeFileSync(
    path.join(STORIES_DIR, filename),
    JSON.stringify(record, null, 2) + '\n'
  );
}

function nextStoryId(): number {
  const files = listStoryFiles();
  if (files.length === 0) return 1;
  const ids = files.map(f => parseInt(f.split('-')[0]));
  return Math.max(...ids) + 1;
}

export function getAllStories(): Story[] {
  return listStoryFiles().map(f => readStory(f));
}

export function getStory(id: number): Story | null {
  const file = listStoryFiles().find(f => f.startsWith(`${id}-`));
  if (!file) return null;
  return readStory(file);
}

export function getStoryContent(story: Story): string | null {
  if (story.content) return story.content;
  if (story.content_file) {
    const filePath = path.join(DATA_DIR, story.content_file);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  }
  return null;
}

export function createStory(data: Partial<Story>): Story {
  const id = nextStoryId();
  const timestamp = now();

  const record: Story = {
    id,
    title: data.title || '',
    description: data.description || null,
    content: data.content || null,
    content_file: data.content_file || null,
    year_start: data.year_start || 0,
    year_end: data.year_end || null,
    era: data.era || 'modern',
    source_ids: data.source_ids || [],
    created_at: timestamp,
    updated_at: timestamp,
  };

  writeStory(record);
  return record;
}

export function updateStory(id: number, data: Partial<Story>): Story | null {
  const existing = getStory(id);
  if (!existing) return null;

  const updated: Story = {
    ...existing,
    ...data,
    id,
    updated_at: now(),
  };

  writeStory(updated);
  return updated;
}

export function deleteStory(id: number): boolean {
  const file = listStoryFiles().find(f => f.startsWith(`${id}-`));
  if (!file) return false;
  fs.unlinkSync(path.join(STORIES_DIR, file));
  return true;
}

// --- Period Quality ---

export interface PeriodQuality {
  start: number;
  end: number;
  quality: 'good' | 'sparse' | 'gap' | 'rich';
  notes?: string;
}

export function getPeriodQuality(): PeriodQuality[] {
  if (!fs.existsSync(PERIOD_QUALITY_FILE)) return [];
  const raw = fs.readFileSync(PERIOD_QUALITY_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function setPeriodQuality(periods: PeriodQuality[]): void {
  fs.writeFileSync(PERIOD_QUALITY_FILE, JSON.stringify(periods, null, 2) + '\n');
}
