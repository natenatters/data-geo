// Approximate territory polygons for the narrative history page.
// These are deliberately rough (~10-30 coordinate pairs each).
// Coordinates are [longitude, latitude] in WGS84 degrees.
// Refine these over time without changing any component code.

export const TERRITORY_POLYGONS: Record<string, [number, number][]> = {

  // Simplified England outline
  england: [
    [-5.7, 50.1], [-4.2, 50.3], [-3.5, 50.2], [-2.0, 50.7], [-1.0, 50.8],
    [0.1, 50.8], [1.4, 51.1], [1.7, 51.4], [1.6, 51.8], [1.0, 52.0],
    [0.5, 52.5], [0.3, 52.9], [0.0, 53.5], [-0.2, 53.7], [0.1, 54.0],
    [-0.4, 54.5], [-1.2, 54.6], [-1.6, 55.0], [-2.0, 55.8], [-2.7, 55.8],
    [-3.0, 55.0], [-3.4, 54.8], [-3.2, 54.1], [-3.1, 53.6], [-3.1, 53.3],
    [-2.8, 53.0], [-3.1, 52.6], [-4.1, 52.9], [-4.7, 52.8], [-5.0, 52.3],
    [-5.3, 51.9], [-4.9, 51.6], [-5.3, 51.4], [-4.2, 51.4], [-3.5, 51.4],
    [-3.2, 51.2], [-4.0, 50.7], [-5.1, 50.3], [-5.7, 50.1],
  ],

  // Historic Lancashire (pre-1974 county boundary, approximate)
  // Bounded roughly by Mersey (south), Pennines (east), Morecambe Bay (north), Irish Sea (west)
  lancashire_historic: [
    [-3.1, 53.35], [-2.7, 53.35], [-2.4, 53.35], [-2.1, 53.5],
    [-2.0, 53.6], [-2.0, 53.8], [-2.1, 54.0], [-2.2, 54.2],
    [-2.5, 54.2], [-2.8, 54.2], [-3.0, 54.1], [-3.1, 53.9],
    [-3.0, 53.8], [-2.9, 53.6], [-3.0, 53.5], [-3.1, 53.35],
  ],

  // County Palatine of Lancaster (roughly coterminous with Lancashire but legally distinct)
  // Using same boundary as historic Lancashire since they overlap
  county_palatine: [
    [-3.1, 53.35], [-2.7, 53.35], [-2.4, 53.35], [-2.1, 53.5],
    [-2.0, 53.6], [-2.0, 53.8], [-2.1, 54.0], [-2.2, 54.2],
    [-2.5, 54.2], [-2.8, 54.2], [-3.0, 54.1], [-3.1, 53.9],
    [-3.0, 53.8], [-2.9, 53.6], [-3.0, 53.5], [-3.1, 53.35],
  ],

  // Salford Hundred — subdivision of Lancashire containing Manchester
  // Roughly: Manchester, Salford, Bolton, Bury, Rochdale, Oldham area
  salford_hundred: [
    [-2.5, 53.4], [-2.3, 53.4], [-2.05, 53.45], [-2.0, 53.55],
    [-2.05, 53.65], [-2.2, 53.7], [-2.4, 53.7], [-2.55, 53.6],
    [-2.55, 53.5], [-2.5, 53.4],
  ],

  // Duchy of Lancaster scattered holdings — core Lancashire + scattered estates
  // Simplified: main Lancashire block + patches in other counties
  duchy_lancaster_core: [
    [-3.1, 53.35], [-2.7, 53.35], [-2.4, 53.35], [-2.1, 53.5],
    [-2.0, 53.6], [-2.0, 53.8], [-2.1, 54.0], [-2.2, 54.2],
    [-2.5, 54.2], [-2.8, 54.2], [-3.0, 54.1], [-3.1, 53.9],
    [-3.0, 53.8], [-2.9, 53.6], [-3.0, 53.5], [-3.1, 53.35],
  ],

  // Duchy holdings in Yorkshire (Knaresborough, Pontefract area)
  duchy_lancaster_yorkshire: [
    [-1.6, 53.7], [-1.3, 53.7], [-1.2, 53.85], [-1.4, 53.95],
    [-1.7, 53.9], [-1.6, 53.7],
  ],

  // Duchy holdings in Lincolnshire/Leicestershire
  duchy_lancaster_midlands: [
    [-1.3, 52.5], [-1.0, 52.5], [-0.8, 52.7], [-0.9, 52.9],
    [-1.2, 52.9], [-1.4, 52.7], [-1.3, 52.5],
  ],

  // Duchy holdings in Norfolk (Castle Rising, etc.)
  duchy_lancaster_norfolk: [
    [0.4, 52.7], [0.7, 52.7], [0.8, 52.85], [0.6, 52.9],
    [0.3, 52.85], [0.4, 52.7],
  ],

  // Duchy of Cornwall — Devon/Cornwall core
  duchy_cornwall: [
    [-5.7, 50.1], [-5.0, 50.05], [-4.2, 50.3], [-3.5, 50.2],
    [-3.4, 50.5], [-3.5, 50.7], [-3.8, 50.8], [-4.2, 50.9],
    [-4.8, 50.8], [-5.1, 50.5], [-5.7, 50.1],
  ],

  // Earldom/County of Chester — Cheshire
  earldom_chester: [
    [-3.1, 53.0], [-2.7, 53.0], [-2.3, 53.1], [-2.1, 53.3],
    [-2.4, 53.35], [-2.7, 53.35], [-3.1, 53.35], [-3.1, 53.2],
    [-3.1, 53.0],
  ],

  // Earldom of Mercia (pre-Conquest) — large band across the Midlands
  earldom_mercia: [
    [-3.0, 52.0], [-1.5, 52.0], [-0.5, 52.2], [0.0, 52.5],
    [0.5, 52.8], [0.5, 53.2], [0.0, 53.5], [-0.5, 53.7],
    [-1.5, 53.8], [-2.0, 53.8], [-2.5, 53.5], [-3.0, 53.3],
    [-3.5, 53.0], [-3.5, 52.5], [-3.0, 52.0],
  ],

  // Crown Estate symbolic — London/Windsor core (modern)
  crown_estate_london: [
    [-0.2, 51.45], [-0.05, 51.45], [0.0, 51.55], [-0.1, 51.58],
    [-0.25, 51.55], [-0.2, 51.45],
  ],

  // Crown Estate — Windsor Great Park
  crown_estate_windsor: [
    [-0.65, 51.38], [-0.55, 51.38], [-0.52, 51.44], [-0.6, 51.45],
    [-0.68, 51.42], [-0.65, 51.38],
  ],

  // Manchester point marker (for labels)
  manchester_point: [
    [-2.26, 53.47], [-2.22, 53.47], [-2.22, 53.49],
    [-2.26, 53.49], [-2.26, 53.47],
  ],
};
