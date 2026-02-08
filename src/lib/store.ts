import fs from 'fs';
import path from 'path';
import type { Source, SourceFile, SourceWithFiles } from './types';

const SOURCES_DIR = path.join(process.cwd(), 'sources');
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure dirs exist
fs.mkdirSync(SOURCES_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

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

export function getStats() {
  const sources = getAllSources();

  const byStage: Record<number, number> = {};
  const byEra: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const s of sources) {
    byStage[s.stage] = (byStage[s.stage] || 0) + 1;
    byEra[s.era] = (byEra[s.era] || 0) + 1;
    byType[s.source_type] = (byType[s.source_type] || 0) + 1;
  }

  const eraOrder = ['roman', 'medieval', 'industrial', 'victorian', 'modern'];

  return {
    total: sources.length,
    byStage: Object.entries(byStage)
      .map(([stage, count]) => ({ stage: parseInt(stage), count }))
      .sort((a, b) => a.stage - b.stage),
    byEra: Object.entries(byEra)
      .map(([era, count]) => ({ era, count }))
      .sort((a, b) => eraOrder.indexOf(a.era) - eraOrder.indexOf(b.era)),
    byType: Object.entries(byType)
      .map(([source_type, count]) => ({ source_type, count })),
    timelineData: sources
      .filter(s => s.year_start != null)
      .map(s => ({
        id: s.id,
        name: s.name,
        year_start: s.year_start!,
        year_end: s.year_end,
        era: s.era,
        stage: s.stage,
        source_type: s.source_type,
      }))
      .sort((a, b) => a.year_start - b.year_start),
  };
}
