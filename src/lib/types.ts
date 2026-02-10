export type SourceType = 'map_overlay' | 'vector_features' | '3d_model' | 'reference_data';
export type Era = 'roman' | 'medieval' | 'industrial' | 'victorian' | 'modern';

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


export interface Story {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  content_file: string | null;
  year_start: number;
  year_end: number | null;
  era: Era;
  source_ids: number[];
  created_at: string;
  updated_at: string;
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

