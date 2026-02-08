export type SourceType = 'map_overlay' | 'vector_features' | '3d_model' | 'reference_data';
export type Era = 'roman' | 'medieval' | 'industrial' | 'victorian' | 'modern';
export type FileType = 'image' | 'geotiff' | 'geojson' | 'czml' | 'kml' | 'other';

export interface Tile {
  url: string;   // XYZ endpoint e.g. https://allmaps.xyz/maps/{hash}/{z}/{x}/{y}.png
  label: string; // e.g. "Sheet 1", "Ward 3: Ardwick"
  georeferenced: boolean; // true = verified, false = external/unverified
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
  2: { fields: ['source_url'], label: 'Source URL required' },
  3: { fields: ['iiif_url', 'georeference_url'], label: 'IIIF manifest and georeference annotation required' },
  4: {
    fields: [],
    label: 'At least one georeferenced tile required',
    check: (source) => source.tiles.some(t => t.georeferenced) ? null : 'Stage 4 requires at least one georeferenced tile',
  },
};

export const STAGE_GUIDANCE: Record<number, {
  action: string;
  description: string;
  tips: string[];
}> = {
  1: {
    action: 'Locate the original source',
    description: 'Find a digital scan of the map in an online archive or library.',
    tips: [
      'Search [NLS](https://maps.nls.uk/), [Manchester Digital Collections](https://www.digitalcollections.manchester.ac.uk/), or [David Rumsey](https://www.davidrumsey.com/)',
      '[Old Maps Online](https://www.oldmapsonline.org/) searches many collections at once',
      'Paste the catalogue or image viewer URL as the source link',
    ],
  },
  2: {
    action: 'Georeference the source',
    description: 'Pin points on the old map to their real-world locations so it can be overlaid on a modern map.',
    tips: [
      'Find the IIIF manifest — a URL that gives georeferencing tools access to the high-res image (check the viewer\'s info panel)',
      'Open it in [AllMaps Editor](https://editor.allmaps.org/) and place 4+ ground control points matching the old map to a modern one',
      'Save and copy the georeference annotation URL — it stores the control points you placed',
    ],
  },
  3: {
    action: 'Add and verify tiles',
    description: 'The georeferenced map gets sliced into XYZ tiles — small images at different zoom levels that map viewers can load.',
    tips: [
      '[AllMaps](https://allmaps.org/) serves tiles automatically at allmaps.xyz/maps/{id}/{z}/{x}/{y}.png',
      'Some institutions like [NLS](https://maps.nls.uk/) host pre-built tile layers',
      'You can also self-host with [gdal2tiles](https://gdal.org/en/stable/programs/gdal2tiles.html) or [MapTiler](https://www.maptiler.com/)',
      'Zoom in and out to check tiles load correctly before marking as verified',
    ],
  },
  4: {
    action: 'Ready for map overlay',
    description: 'This source has verified tiles and can be overlaid on a modern map in any compatible viewer.',
    tips: [
      'Open the map preview to check alignment with modern geography',
      'Make sure the bounding box is set so the source appears in the right place',
      'Compare with other sources from the same period for consistency',
    ],
  },
};

export interface HelpContent {
  what: string;
  why: string;
  how: string;
  links: { label: string; url: string }[];
}

export const PIPELINE_HELP: Record<string, HelpContent> = {
  source_url: {
    what: 'The URL where the original map image lives — a catalogue page or image viewer in a digital archive.',
    why: 'Everything starts here. The source URL is the provenance record and the entry point for IIIF discovery.',
    how: 'Search NLS, Manchester Digital Collections, David Rumsey, or Old Maps Online. Paste the catalogue or viewer URL.',
    links: [
      { label: 'National Library of Scotland', url: 'https://maps.nls.uk/' },
      { label: 'Manchester Digital Collections', url: 'https://www.digitalcollections.manchester.ac.uk/' },
      { label: 'David Rumsey', url: 'https://www.davidrumsey.com/' },
      { label: 'Old Maps Online', url: 'https://www.oldmapsonline.org/' },
    ],
  },
  iiif_url: {
    what: 'A IIIF manifest or info.json URL that gives tools standardised access to the high-resolution image.',
    why: 'Georeferencing tools (like AllMaps) need IIIF to read the image. Without it, you can\'t place ground control points.',
    how: 'Look for a IIIF logo or "info" link in the archive\'s viewer. The URL usually ends in manifest.json or info.json.',
    links: [
      { label: 'What is IIIF?', url: 'https://iiif.io/get-started/' },
    ],
  },
  georeference_url: {
    what: 'A W3C Web Annotation that records ground control points — how locations on the old map correspond to real-world coordinates.',
    why: 'This is the mathematical bridge between the old map and modern geography. Tile services use it to warp the image into place.',
    how: 'Open the IIIF manifest in AllMaps Editor. Place 4+ control points matching old map features to their modern locations. Copy the annotation URL.',
    links: [
      { label: 'AllMaps Editor', url: 'https://editor.allmaps.org/' },
      { label: 'W3C Web Annotation', url: 'https://www.w3.org/TR/annotation-model/' },
    ],
  },
  tiles: {
    what: 'XYZ tile endpoints — small images at different zoom levels that map viewers load on demand.',
    why: 'Tiles are what actually appear on the map. The URL pattern /{z}/{x}/{y}.png lets viewers request only the area in view.',
    how: 'AllMaps serves tiles automatically. Some institutions host pre-built tile layers. You can also self-host with gdal2tiles or MapTiler.',
    links: [
      { label: 'AllMaps', url: 'https://allmaps.org/' },
      { label: 'NLS Tile Layers', url: 'https://maps.nls.uk/' },
      { label: 'gdal2tiles', url: 'https://gdal.org/en/stable/programs/gdal2tiles.html' },
      { label: 'MapTiler', url: 'https://www.maptiler.com/' },
    ],
  },
  bounds: {
    what: 'A WGS84 bounding box (west, south, east, north) that defines the spatial extent of this source.',
    why: 'The bounding box tells the map viewer where to position the overlay. Without it, the source won\'t appear in the right place.',
    how: 'Use the map preview or a tool like bboxfinder.com to identify the corner coordinates. Enter them as decimal degrees.',
    links: [
      { label: 'bboxfinder.com', url: 'http://bboxfinder.com/' },
    ],
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
