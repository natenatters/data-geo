export type SourceType = 'map_overlay' | 'vector_features' | '3d_model' | 'reference_data';
export type Era = 'roman' | 'medieval' | 'industrial' | 'victorian' | 'modern';
export type FileType = 'image' | 'geotiff' | 'geojson' | 'czml' | 'kml' | 'other';

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
  4: 'Cesium-Ready',
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
