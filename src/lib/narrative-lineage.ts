import { PALETTE } from './narrative-periods';

export interface LineageNode {
  id: string;
  name: string;
  years: string;
  yearStart: number;
  yearEnd: number;
  lane: 'crown' | 'lancaster' | 'cornwall';
  periodId: string;
  note?: string;
}

export interface LineageLink {
  from: string;
  to: string;
  type: 'son' | 'daughter' | 'marriage' | 'conquest' | 'merger' | 'grant' | 'act';
  label?: string;
}

export const LANE_COLORS: Record<LineageNode['lane'], string> = {
  crown: PALETTE.crown,
  lancaster: PALETTE.lancaster,
  cornwall: PALETTE.cornwall,
};

export const LANE_LABELS: Record<LineageNode['lane'], string> = {
  crown: 'Crown',
  lancaster: 'Duchy of Lancaster',
  cornwall: 'Duchy of Cornwall',
};

// ─── Nodes ───────────────────────────────────────────────────────────

export const LINEAGE_NODES: LineageNode[] = [
  // Period 1: Anglo-Saxon (900–1066)
  { id: 'edward-confessor', name: 'Edward the Confessor', years: '1042–1066', yearStart: 1042, yearEnd: 1066, lane: 'crown', periodId: 'anglo-saxon', note: 'Last Old English king' },

  // Period 2: Norman Conquest (1066–1100)
  { id: 'william-i', name: 'William I', years: '1066–1087', yearStart: 1066, yearEnd: 1087, lane: 'crown', periodId: 'norman-conquest', note: 'Conquered England' },
  { id: 'william-ii', name: 'William II', years: '1087–1100', yearStart: 1087, yearEnd: 1100, lane: 'crown', periodId: 'norman-conquest', note: 'Son of William I' },
  { id: 'roger-poitou', name: 'Roger de Poitou', years: '1069–1102', yearStart: 1069, yearEnd: 1102, lane: 'lancaster', periodId: 'norman-conquest', note: 'Granted Lancashire' },

  // Period 3: Earls & Palatinate (1100–1351)
  { id: 'henry-iii', name: 'Henry III', years: '1216–1272', yearStart: 1216, yearEnd: 1272, lane: 'crown', periodId: 'earls-palatinate' },
  { id: 'edward-i', name: 'Edward I', years: '1272–1307', yearStart: 1272, yearEnd: 1307, lane: 'crown', periodId: 'earls-palatinate' },
  { id: 'edmund-crouchback', name: 'Edmund Crouchback', years: '1267–1296', yearStart: 1267, yearEnd: 1296, lane: 'lancaster', periodId: 'earls-palatinate', note: '1st Earl of Lancaster' },
  { id: 'thomas-2nd-earl', name: 'Thomas', years: '1296–1322', yearStart: 1296, yearEnd: 1322, lane: 'lancaster', periodId: 'earls-palatinate', note: '2nd Earl — executed' },
  { id: 'henry-grosmont', name: 'Henry of Grosmont', years: '1345–1361', yearStart: 1345, yearEnd: 1361, lane: 'lancaster', periodId: 'earls-palatinate', note: '1st Duke of Lancaster' },
  { id: 'edward-iii', name: 'Edward III', years: '1327–1377', yearStart: 1327, yearEnd: 1377, lane: 'crown', periodId: 'earls-palatinate' },
  { id: 'black-prince', name: 'Edward Black Prince', years: '1337–1376', yearStart: 1337, yearEnd: 1376, lane: 'cornwall', periodId: 'earls-palatinate', note: '1st Duke of Cornwall' },

  // Period 4: Duchy of Lancaster (1351–1399)
  { id: 'john-of-gaunt', name: 'John of Gaunt', years: '1362–1399', yearStart: 1362, yearEnd: 1399, lane: 'lancaster', periodId: 'duchy-lancaster', note: '2nd Duke — richest man in England' },
  { id: 'richard-ii', name: 'Richard II', years: '1377–1399', yearStart: 1377, yearEnd: 1399, lane: 'crown', periodId: 'duchy-lancaster', note: 'Deposed by Bolingbroke' },

  // Period 5: Crown & Duchy merge (1399–1603) — Lancaster lane ends here
  { id: 'henry-iv', name: 'Henry IV', years: '1399–1413', yearStart: 1399, yearEnd: 1413, lane: 'crown', periodId: 'crown-duchy-merge', note: 'Merged Crown + Lancaster' },
  { id: 'henry-viii', name: 'Henry VIII', years: '1509–1547', yearStart: 1509, yearEnd: 1547, lane: 'crown', periodId: 'crown-duchy-merge', note: 'Dissolved monasteries' },
  { id: 'cornwall-tudor', name: 'Princes of Wales', years: '1399–1603', yearStart: 1399, yearEnd: 1603, lane: 'cornwall', periodId: 'crown-duchy-merge', note: 'Duchy passes to each heir' },

  // Period 6: Civil War (1603–1714)
  { id: 'charles-i', name: 'Charles I', years: '1625–1649', yearStart: 1625, yearEnd: 1649, lane: 'crown', periodId: 'civil-war', note: 'Executed' },
  { id: 'cromwell', name: 'Oliver Cromwell', years: '1649–1658', yearStart: 1649, yearEnd: 1658, lane: 'crown', periodId: 'civil-war', note: 'Lord Protector — no king' },
  { id: 'charles-ii', name: 'Charles II', years: '1660–1685', yearStart: 1660, yearEnd: 1685, lane: 'crown', periodId: 'civil-war', note: 'Restoration' },

  // Period 7: Great Bargain (1714–1837)
  { id: 'george-iii', name: 'George III', years: '1760–1820', yearStart: 1760, yearEnd: 1820, lane: 'crown', periodId: 'great-bargain', note: 'Surrendered Crown lands' },

  // Period 8: Modern (1837–2026)
  { id: 'charles-iii', name: 'Charles III', years: '2022–', yearStart: 2022, yearEnd: 2026, lane: 'crown', periodId: 'modern', note: 'King & Duke of Lancaster' },
  { id: 'prince-william', name: 'Prince William', years: '2022–', yearStart: 2022, yearEnd: 2026, lane: 'cornwall', periodId: 'modern', note: 'Duke of Cornwall' },
];

// ─── Links ───────────────────────────────────────────────────────────

export const LINEAGE_LINKS: LineageLink[] = [
  // Crown succession
  { from: 'edward-confessor', to: 'william-i', type: 'conquest', label: 'Conquered' },
  { from: 'william-i', to: 'william-ii', type: 'son' },
  { from: 'william-ii', to: 'henry-iii', type: 'son', label: '(generations)' },
  { from: 'henry-iii', to: 'edward-i', type: 'son' },
  { from: 'edward-i', to: 'edward-iii', type: 'son', label: '(via Edward II)' },
  { from: 'edward-iii', to: 'richard-ii', type: 'son', label: 'Grandson' },
  { from: 'richard-ii', to: 'henry-iv', type: 'conquest', label: 'Deposed' },
  { from: 'henry-iv', to: 'henry-viii', type: 'son', label: '(generations)' },
  { from: 'henry-viii', to: 'charles-i', type: 'son', label: '(via Stuarts)' },
  { from: 'charles-i', to: 'cromwell', type: 'conquest', label: 'Executed' },
  { from: 'cromwell', to: 'charles-ii', type: 'son', label: 'Restoration' },
  { from: 'charles-ii', to: 'george-iii', type: 'son', label: '(generations)' },
  { from: 'george-iii', to: 'charles-iii', type: 'son', label: '(generations)' },

  // Lancaster succession
  { from: 'william-i', to: 'roger-poitou', type: 'grant', label: 'Granted' },
  { from: 'henry-iii', to: 'edmund-crouchback', type: 'grant', label: 'Created Earldom' },
  { from: 'edmund-crouchback', to: 'thomas-2nd-earl', type: 'son' },
  { from: 'thomas-2nd-earl', to: 'henry-grosmont', type: 'son', label: '(via brother)' },
  { from: 'henry-grosmont', to: 'john-of-gaunt', type: 'marriage', label: 'Married daughter' },
  { from: 'john-of-gaunt', to: 'henry-iv', type: 'merger', label: 'Son becomes King' },

  // Cornwall succession
  { from: 'edward-iii', to: 'black-prince', type: 'grant', label: 'Created 1337' },
  { from: 'black-prince', to: 'cornwall-tudor', type: 'act', label: 'Passes to each heir' },
  { from: 'cornwall-tudor', to: 'prince-william', type: 'act', label: '(continues)' },
];

// Year range for positioning
export const LINEAGE_YEAR_MIN = 1042;
export const LINEAGE_YEAR_MAX = 2026;
