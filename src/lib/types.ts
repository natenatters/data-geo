export type SourceType = 'map_overlay' | 'vector_features' | '3d_model' | 'reference_data';
export type Era = 'roman' | 'medieval' | 'industrial' | 'victorian' | 'modern';
export type FileType = 'image' | 'geotiff' | 'geojson' | 'czml' | 'kml' | 'other';

export interface Tile {
  url: string;   // XYZ endpoint or WMS base URL
  label: string; // e.g. "Sheet 1", "Ward 3: Ardwick"
  georeferenced: boolean; // true = verified, false = external/unverified
  type?: 'xyz' | 'wms'; // default: 'xyz'
  wms_layers?: string;   // WMS layer name(s), required when type='wms'
}

export interface Source {
  id: number;
  name: string;
  description: string | null;
  source_url: string | null;
  source_type: SourceType;
  stage: number;
  year_start: number | null;
  year_end: number | null;
  era: Era;
  bounds_west: number | null;
  bounds_south: number | null;
  bounds_east: number | null;
  bounds_north: number | null;
  notes: string | null;
  // Stage gate fields
  iiif_url: string | null;        // IIIF manifest or info.json — required for stage 3
  georeference_url: string | null; // AllMaps annotation or proof — required for stage 3
  tiles: Tile[];                   // XYZ tile endpoints — required for stage 4
  created_at: string;
  updated_at: string;
}

export interface SourceFile {
  id: number;
  source_id: number;
  filename: string;
  filepath: string;
  filetype: FileType;
  created_at: string;
}

export interface SourceWithFiles extends Source {
  files: SourceFile[];
}

export const STAGES: Record<number, string> = {
  1: 'Discovered',
  2: 'Acquired',
  3: 'Georeferenced',
  4: 'Map-Ready',
};

export const ERAS: Record<Era, { label: string; color: string }> = {
  roman: { label: 'Roman', color: '#dc2626' },
  medieval: { label: 'Medieval', color: '#ea580c' },
  industrial: { label: 'Industrial', color: '#ca8a04' },
  victorian: { label: 'Victorian', color: '#16a34a' },
  modern: { label: 'Modern', color: '#2563eb' },
};

export const SOURCE_TYPES: Record<SourceType, string> = {
  map_overlay: 'Map Overlay',
  vector_features: 'Vector Features',
  '3d_model': '3D Model',
  reference_data: 'Reference Data',
};

// Stage gate requirements — what fields are needed to advance TO each stage
export const STAGE_GATES: Record<number, {
  fields: (keyof Source)[];
  label: string;
  check?: (source: Source) => string | null;
}> = {
  2: { fields: [], label: 'No requirements' },
  3: { fields: ['georeference_url'], label: 'Georeference annotation required' },
  4: {
    fields: [],
    label: 'At least one georeferenced tile required',
    check: (source) => source.tiles.some(t => t.georeferenced) ? null : 'Stage 4 requires at least one georeferenced tile',
  },
};


export function getStageGateErrors(source: Source, targetStage: number): string[] {
  const errors: string[] = [];
  // Check all gates up to and including the target stage
  for (let stage = 2; stage <= targetStage; stage++) {
    const gate = STAGE_GATES[stage];
    if (!gate) continue;
    for (const field of gate.fields) {
      const val = source[field];
      if (val === null || val === undefined || val === '') {
        errors.push(`Stage ${stage} requires ${field.replace(/_/g, ' ')}`);
      }
    }
    if (gate.check) {
      const err = gate.check(source);
      if (err) errors.push(err);
    }
  }
  return errors;
}
