export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface TerritoryRef {
  id: string;       // Key into TERRITORY_POLYGONS
  label: string;
  color: string;    // Hex — use PALETTE constants for consistency
  opacity: number;  // 0-1
}

export interface MarkerRef {
  longitude: number;
  latitude: number;
  label: string;
  color: string;    // Hex
  size: number;     // Pixel radius
}

export interface CameraPosition {
  longitude: number;
  latitude: number;
  height: number;   // Metres
  pitch?: number;   // Radians, default -90 (top-down)
}

export interface KeyEntity {
  name: string;
  role: string;
  holds: string;
}

export interface NarrativePeriod {
  id: string;
  yearStart: number;
  yearEnd: number;
  title: string;
  subtitle: string;
  narrative: string;
  glossary: GlossaryEntry[];
  territories: TerritoryRef[];
  markers: MarkerRef[];
  camera: CameraPosition;
  keyEntities: KeyEntity[];
}

// Semantic color palette — same entity always the same color across all periods
export const PALETTE = {
  crown:       '#b8860b', // dark gold — Crown / royal authority
  lancaster:   '#ea580c', // orange — Duchy of Lancaster / Lancaster family
  cornwall:    '#059669', // emerald — Duchy of Cornwall
  crownEstate: '#1e40af', // deep blue — royal lands / Crown Estate
  manchester:  '#dc2626', // red — Manchester / Salford (focal point)
  context:     '#94a3b8', // slate — background / context territories
} as const;

// Legend entries for the map overlay
export const LEGEND_ENTRIES = [
  { color: PALETTE.crown,       label: 'Crown / Royal' },
  { color: PALETTE.lancaster,   label: 'Duchy of Lancaster' },
  { color: PALETTE.cornwall,    label: 'Duchy of Cornwall' },
  { color: PALETTE.crownEstate, label: 'Royal Lands' },
  { color: PALETTE.manchester,  label: 'Manchester' },
  { color: PALETTE.context,     label: 'Other territory' },
] as const;

// Reusable markers
const M = {
  manchester: { longitude: -2.24, latitude: 53.48, label: 'Manchester', color: PALETTE.manchester, size: 10 },
  london:     { longitude: -0.12, latitude: 51.51, label: 'London', color: PALETTE.crown, size: 12 },
  lancaster:  { longitude: -2.80, latitude: 54.05, label: 'Lancaster Castle', color: PALETTE.lancaster, size: 8 },
  pontefract: { longitude: -1.31, latitude: 53.69, label: 'Pontefract', color: PALETTE.lancaster, size: 6 },
  windsor:    { longitude: -0.60, latitude: 51.48, label: 'Windsor', color: PALETTE.crownEstate, size: 7 },
} as const;

export const NARRATIVE_PERIODS: NarrativePeriod[] = [
  // ── Period 1: Anglo-Saxon England ────────────────────────────────
  {
    id: 'anglo-saxon',
    yearStart: 900,
    yearEnd: 1066,
    title: 'Before the Conquest',
    subtitle: 'Anglo-Saxon England: a patchwork of earldoms',
    narrative: `Before 1066, England had no formal royal estate, no Duchies, and no Dukes. The king ruled through a council of nobles called the Witan, and land was held by local lords called Thegns and Earls.

An Earl wasn't just a title — it meant you governed a large region on the king's behalf, collected taxes, raised armies, and administered justice. The biggest earldom in the Midlands was Mercia, a vast territory stretching across central England.

Lancashire barely existed as a concept. The land "between Ribble and Mersey" (roughly modern Lancashire and Greater Manchester) was a sparsely populated frontier. In 919, King Edward the Elder had ordered a fortified town — a burh — built at Mameceastre (Manchester), but by the time of Edward the Confessor it was simply part of the royal holdings, not a county or earldom of its own.

The Domesday Book of 1086 would later record that the Salford Hundred (the district containing Manchester) was held by Edward the Confessor before the Conquest — meaning it was royal land, the king's own property.`,
    glossary: [
      { term: 'Thegn', definition: 'An Anglo-Saxon lord who held land directly from the king in exchange for military service.' },
      { term: 'Earl', definition: 'The highest rank below the king. Earls governed entire regions — not just a title, but real power over courts, taxes, and armies.' },
      { term: 'Witan', definition: 'The king\'s council of senior nobles and clergy. They advised (and sometimes chose) the king.' },
      { term: 'Hundred', definition: 'An administrative subdivision of a county, used for tax collection and local justice. The Salford Hundred contained Manchester.' },
      { term: 'Shire', definition: 'A county — the main unit of local government. Governed by a Shire-Reeve (Sheriff) on the king\'s behalf.' },
      { term: 'Burh', definition: 'A fortified town built for defence. Edward the Elder built one at Manchester in 919 as part of his campaign against the Vikings.' },
    ],
    territories: [
      { id: 'england', label: 'England', color: PALETTE.context, opacity: 0.15 },
      { id: 'earldom_mercia', label: 'Earldom of Mercia', color: PALETTE.context, opacity: 0.25 },
      { id: 'manchester_point', label: 'Mameceastre', color: PALETTE.manchester, opacity: 0.5 },
    ],
    markers: [
      M.manchester,
      M.london,
    ],
    camera: { longitude: -1.5, latitude: 53.0, height: 600000 },
    keyEntities: [
      { name: 'Edward the Confessor', role: 'King of England', holds: 'Royal demesne including the Salford Hundred (Manchester area)' },
      { name: 'Various Earls', role: 'Regional governors', holds: 'Earldoms granted by the king — real territorial power, not just titles' },
    ],
  },

  // ── Period 2: The Norman Conquest ────────────────────────────────
  {
    id: 'norman-conquest',
    yearStart: 1066,
    yearEnd: 1100,
    title: 'The Norman Conquest',
    subtitle: 'Every acre in England now has a master',
    narrative: `In 1066, William of Normandy conquered England and made a radical claim: ALL land in England now belonged to him personally, by right of conquest. This had never happened before in English history.

William then redistributed the land to about 200 Norman families who had helped him invade. But crucially, they didn't "own" it — they held it from the king in exchange for military service. This was the feudal system: a pyramid with the king at the top, his tenants-in-chief below, their sub-tenants below that, and the peasants at the bottom.

The land William kept for himself was called the "royal demesne" — his personal estates. The Domesday Book of 1086 recorded that the king still held over 18% of all English land directly.

In Lancashire, William granted the "land between Ribble and Mersey" to Roger de Poitou, son of one of his key allies. Roger held Manchester, Salford, Rochdale, and dozens of other settlements. But this wasn't ownership in the modern sense — Roger held it from the king and could lose it at any time (and eventually did).

Roger in turn granted Manchester itself to Albert de Gresle (Grelley), who became the first Baron of Manchester. The feudal chain: King \u2192 Roger de Poitou \u2192 Albert de Gresle \u2192 local tenants.`,
    glossary: [
      { term: 'Tenant-in-chief', definition: 'A lord who held land directly from the king — the top rung of the feudal ladder below the monarch.' },
      { term: 'Royal demesne', definition: 'Land the king kept for himself rather than granting to tenants. His personal income source.' },
      { term: 'Honour', definition: 'A large feudal estate held by a tenant-in-chief, often scattered across multiple counties. The Honour of Lancaster was one.' },
      { term: 'Domesday Book', definition: 'William\'s great survey of 1086 — recorded who held every piece of land in England and what it was worth.' },
      { term: 'Feudal tenure', definition: 'The system where land was held in exchange for service (usually military). You didn\'t "own" land — you held it from someone above you.' },
      { term: 'Barony', definition: 'An estate held by a Baron — a tenant-in-chief owing knight service to the king.' },
    ],
    territories: [
      { id: 'england', label: 'Crown land (all England)', color: PALETTE.crown, opacity: 0.2 },
      { id: 'lancashire_historic', label: 'Roger de Poitou\'s grant', color: PALETTE.lancaster, opacity: 0.3 },
      { id: 'earldom_chester', label: 'Earldom of Chester', color: PALETTE.context, opacity: 0.2 },
      { id: 'salford_hundred', label: 'Salford Hundred', color: PALETTE.manchester, opacity: 0.35 },
    ],
    markers: [
      M.manchester,
      M.london,
      M.lancaster,
    ],
    camera: { longitude: -2.5, latitude: 53.5, height: 250000 },
    keyEntities: [
      { name: 'William I', role: 'King of England', holds: 'ALL English land by right of conquest. Keeps ~18% as royal demesne.' },
      { name: 'Roger de Poitou', role: 'Tenant-in-chief', holds: 'The "land between Ribble and Mersey" — 50+ settlements including Manchester.' },
      { name: 'Albert de Gresle', role: 'Baron of Manchester', holds: 'Manchester itself, granted by Roger. First of 8 Grelley barons.' },
    ],
  },

  // ── Period 3: Earls and the Palatinate ───────────────────────────
  {
    id: 'earls-palatinate',
    yearStart: 1100,
    yearEnd: 1351,
    title: 'Earls and the County Palatine',
    subtitle: 'Lancaster grows into a state within a state',
    narrative: `For 250 years, the Grelley family held Manchester as barons under the Honour of Lancaster. But the real story is what was happening above them in the feudal chain.

In 1267, King Henry III gave his younger son Edmund Crouchback the County, Honour, and Castle of Lancaster — creating the Earldom of Lancaster. This was the seed of everything that followed. Edmund was loyal to his brother King Edward I and served faithfully, but the estate he built was enormous.

His son Thomas, the 2nd Earl, inherited even more land through marriage to Alice de Lacy (gaining Rochdale, Bury, Clitheroe, and more). Thomas became the most powerful nobleman in England — so powerful that he led a rebellion against his cousin King Edward II. He was captured at the Battle of Boroughbridge in 1322 and executed at Pontefract Castle.

The estate survived Thomas's fall. His brother Henry recovered the lands, and by 1351 his grandson Henry of Grosmont was so important that Edward III elevated Lancashire to a County Palatine and made Grosmont the first Duke of Lancaster.

"Palatine" meant "of the palace" — the Duke had near-royal powers within Lancashire: his own courts, his own judges, his own sheriff. It was a state within a state. And this wasn't just a title — the Duke ran Lancashire like a separate country.`,
    glossary: [
      { term: 'Earl', definition: 'In this period: a major lord with real governing power over a county. The Earl of Lancaster controlled courts, taxes, and armies across a huge estate.' },
      { term: 'County Palatine', definition: 'A county where the lord (not the king) had royal-level powers: own courts, own judges, own sheriff. Lancashire became one in 1351.' },
      { term: 'Palatinate', definition: 'The territory governed as a County Palatine. "Palatine" means "of the palace" — the lord exercises palace-level (i.e. royal) powers.' },
      { term: 'Honour of Lancaster', definition: 'The feudal estate centred on Lancaster Castle. The Grelley barons of Manchester owed knight service to this Honour.' },
      { term: 'Salford Hundred', definition: 'The administrative district containing Manchester, Bolton, Bury, Rochdale, and Oldham. Governed through its own Court Leet.' },
      { term: 'Duke', definition: 'A rank ABOVE Earl, invented in England in 1337. The first two English Dukes (Cornwall 1337, Lancaster 1351) came with real territory and real power. Later Dukes mostly just got the title.' },
    ],
    territories: [
      { id: 'england', label: 'England', color: PALETTE.context, opacity: 0.12 },
      { id: 'county_palatine', label: 'County Palatine of Lancaster', color: PALETTE.lancaster, opacity: 0.35 },
      { id: 'salford_hundred', label: 'Salford Hundred', color: PALETTE.manchester, opacity: 0.35 },
      { id: 'earldom_chester', label: 'County Palatine of Chester', color: PALETTE.context, opacity: 0.18 },
    ],
    markers: [
      M.manchester,
      M.lancaster,
      M.london,
    ],
    camera: { longitude: -2.5, latitude: 53.7, height: 200000 },
    keyEntities: [
      { name: 'Edmund Crouchback', role: '1st Earl of Lancaster (1267)', holds: 'County, Honour, and Castle of Lancaster. Loyal to the Crown.' },
      { name: 'Thomas, 2nd Earl', role: 'Most powerful lord in England', holds: 'Vast estates across England. Rebelled against Edward II. Executed 1322.' },
      { name: 'Henry of Grosmont', role: '1st Duke of Lancaster (1351)', holds: 'County Palatine with near-sovereign powers. Own courts, judges, sheriff.' },
    ],
  },

  // ── Period 4: The Duchy of Lancaster ─────────────────────────────
  {
    id: 'duchy-lancaster',
    yearStart: 1351,
    yearEnd: 1399,
    title: 'The Duchy of Lancaster',
    subtitle: 'Two Dukes, then the Duchy swallows the Crown',
    narrative: `There were only ever two independent Dukes of Lancaster. The whole era lasted just 48 years — but it changed English history permanently.

Henry of Grosmont, the 1st Duke, died in 1361. His daughter Blanche married John of Gaunt, the third son of King Edward III, who became the 2nd Duke of Lancaster in 1362.

Gaunt was the richest man in England. His income was equivalent to roughly \u00a3200 million in today's money. He owned over 30 castles, maintained a household the size of a king's, and held lands scattered across 40+ English counties — not just Lancashire but estates in Yorkshire, Norfolk, Lincolnshire, and the Midlands. The Duchy of Lancaster was not just a county — it was a nationwide property empire.

Gaunt's power made him a rival to the Crown itself. When his nephew Richard II became king, the tension was constant. When Gaunt died in 1399, Richard made a fatal mistake: he seized the Duchy estates, refusing to let Gaunt's son Henry Bolingbroke inherit.

Bolingbroke invaded England, deposed Richard, and took the throne as Henry IV. One of his first acts was to have Parliament declare that the Duchy of Lancaster would be held separately from all other Crown possessions — permanently. As a king whose claim rested on conquest rather than clear succession, keeping an independent estate outside the Crown offered a degree of security.

That decision, made out of insecurity in 1399, is why the Duchy of Lancaster still exists as a separate entity today.`,
    glossary: [
      { term: 'Duchy', definition: 'A property estate with land, income, and special legal status attached to the ducal title. Only Lancaster and Cornwall have functioned as real Duchies in England; other dukedoms carried the title without territory.' },
      { term: 'Duke', definition: 'The highest rank of nobility. But after Lancaster and Cornwall, the title was handed out as a prestige label with no territory behind it.' },
      { term: 'Duchy of Lancaster', definition: 'The private estate of the Earls/Dukes of Lancaster. Scattered holdings across 40+ counties, not just Lancashire. Becomes the king\'s personal income after 1399.' },
      { term: 'County Palatine', definition: 'Still the governance structure within Lancashire — own courts, own sheriff. But now the Duke IS the king.' },
    ],
    territories: [
      { id: 'england', label: 'England', color: PALETTE.context, opacity: 0.12 },
      { id: 'duchy_lancaster_core', label: 'Duchy core (Lancashire)', color: PALETTE.lancaster, opacity: 0.4 },
      { id: 'duchy_lancaster_yorkshire', label: 'Duchy (Yorkshire)', color: PALETTE.lancaster, opacity: 0.3 },
      { id: 'duchy_lancaster_midlands', label: 'Duchy (Midlands)', color: PALETTE.lancaster, opacity: 0.3 },
      { id: 'duchy_lancaster_norfolk', label: 'Duchy (Norfolk)', color: PALETTE.lancaster, opacity: 0.3 },
      { id: 'salford_hundred', label: 'Salford Hundred', color: PALETTE.manchester, opacity: 0.3 },
    ],
    markers: [
      M.manchester,
      M.lancaster,
      M.london,
      M.pontefract,
    ],
    camera: { longitude: -1.5, latitude: 53.0, height: 500000 },
    keyEntities: [
      { name: 'Henry of Grosmont', role: '1st Duke of Lancaster (1351-1361)', holds: 'County Palatine + scattered estates. Near-sovereign powers in Lancashire.' },
      { name: 'John of Gaunt', role: '2nd Duke of Lancaster (1362-1399)', holds: 'Richest man in England. 30+ castles. ~\u00a3200M income in today\'s money.' },
      { name: 'Henry IV (Bolingbroke)', role: 'King from 1399', holds: 'Seized the throne AND kept the Duchy separate from Crown lands — permanently.' },
    ],
  },

  // ── Period 5: Crown and Duchy Merge ──────────────────────────────
  {
    id: 'crown-duchy-merge',
    yearStart: 1399,
    yearEnd: 1603,
    title: 'The King\'s Two Hats',
    subtitle: 'Crown and Duchy: same person, different pockets',
    narrative: `After 1399, the king held two separate identities: the Crown (public) and the Duke of Lancaster (private). Same person, different legal capacities, different bank accounts.

Edward IV confirmed this arrangement in 1461 — even though he was a Yorkist who had defeated the Lancastrians in the Wars of the Roses. Why would a Yorkist king preserve the Duchy of Lancaster? Because he saw the same advantage Henry IV had: independent income outside Parliament's control.

Meanwhile in Manchester, the Grelley family finally died out in 1347 and the manor passed to the de la Warre family. Thomas de la Warre founded a collegiate church in 1421 (now Manchester Cathedral) and a college (now Chetham's Library). But the real power — the Salford Hundred's administration — ran through the Duchy's Court Leet, which regulated trade, appointed constables, and administered local justice.

Henry VIII's dissolution of the monasteries (1530s-1540s) massively expanded Crown lands. But again, the Duchy of Lancaster stayed separate — absorbing some former monastic properties into its own portfolio rather than the Crown's.

By this period, the word "Duke" had become mostly meaningless. Dozens of dukedoms were created for royal sons and favourites, but none came with actual land or power. Only Lancaster and Cornwall remained real Duchies with real estates. The concept of "Duke = powerful territorial ruler" lasted about 50 years (1337-1399). After that it was just a label — except for these two.`,
    glossary: [
      { term: 'Crown', definition: 'The abstract legal concept of the state, distinct from the king personally. "Crown property" means state property. The sovereign acts "in right of the Crown" when conducting government business.' },
      { term: 'Duchy of Lancaster', definition: 'The king\'s PRIVATE estate — separate from the Crown. The king acts "in right of the Duchy" when managing it. Different legal person, different rules.' },
      { term: 'The King\'s Two Capacities', definition: 'A legal doctrine: the king is one person but acts in two roles. "In right of the Crown" (public/state) and "in right of the Duchy" (private/personal).' },
      { term: 'Court Leet', definition: 'The local court that governed the Salford Hundred on behalf of the Duchy. Regulated markets, appointed constables, administered justice. Survived until 1971.' },
      { term: 'Dissolution of the Monasteries', definition: 'Henry VIII seized all monastery lands (1530s-40s). Vastly expanded Crown holdings. The Duchy absorbed some too, keeping them separate.' },
    ],
    territories: [
      { id: 'england', label: 'England', color: PALETTE.context, opacity: 0.12 },
      { id: 'duchy_lancaster_core', label: 'Duchy of Lancaster (core)', color: PALETTE.lancaster, opacity: 0.35 },
      { id: 'duchy_lancaster_yorkshire', label: 'Duchy (Yorkshire)', color: PALETTE.lancaster, opacity: 0.25 },
      { id: 'duchy_lancaster_midlands', label: 'Duchy (Midlands)', color: PALETTE.lancaster, opacity: 0.25 },
      { id: 'duchy_lancaster_norfolk', label: 'Duchy (Norfolk)', color: PALETTE.lancaster, opacity: 0.25 },
      { id: 'duchy_cornwall', label: 'Duchy of Cornwall (heir)', color: PALETTE.cornwall, opacity: 0.25 },
      { id: 'salford_hundred', label: 'Salford Hundred', color: PALETTE.manchester, opacity: 0.25 },
    ],
    markers: [
      M.manchester,
      M.lancaster,
      M.london,
    ],
    camera: { longitude: -1.5, latitude: 52.5, height: 600000 },
    keyEntities: [
      { name: 'Edward IV', role: 'Yorkist King (1461)', holds: 'Confirmed Duchy\'s separate status — even though he defeated the Lancastrians.' },
      { name: 'Henry VIII', role: 'King (1509-1547)', holds: 'Dissolved monasteries. Crown and Duchy both expanded, but stayed separate.' },
      { name: 'Thomas de la Warre', role: 'Lord of Manchester Manor', holds: 'Founded Manchester Cathedral (1421) and Chetham\'s (now the library).' },
    ],
  },

  // ── Period 6: Civil War and Commonwealth ─────────────────────────
  {
    id: 'civil-war',
    yearStart: 1603,
    yearEnd: 1714,
    title: 'Crown Lands Crumble',
    subtitle: 'Wars, sales, and the Duchy survives again',
    narrative: `The Stuart kings were chronically short of money. James I and Charles I sold off Crown lands to fund wars and lavish courts. By the time the English Civil War erupted in 1642, the Crown estate had shrunk dramatically.

During the Commonwealth (1649-1660), Parliament seized and sold off most remaining Crown lands. Oliver Cromwell had no use for royal estates. Manchester itself was besieged during the Civil War — the town was Parliamentarian, surrounded by Royalist forces.

When Charles II was restored to the throne in 1660, some Crown lands were recovered — but many had been sold to private buyers who weren't giving them back. The Crown estate was at its lowest ebb in centuries.

Through all of this upheaval, the Duchy of Lancaster survived. Its separate legal status — technically not "Crown" property — made it harder to justify seizing. The distinction Henry IV had insisted on in 1399 proved its worth: when Crown lands were confiscated, the Duchy's different legal footing offered some protection.

By the early 1700s, the Crown estate produced very little revenue. The king was increasingly dependent on Parliament for money — which is exactly the dynamic that would lead to the Great Bargain of 1760.`,
    glossary: [
      { term: 'Crown lands', definition: 'Property held "in right of the Crown" — the public royal estate. Distinct from the Duchy of Lancaster (private). Stuart kings sold much of it off.' },
      { term: 'Civil List', definition: 'An annual payment from Parliament to the king for household expenses. Became necessary as Crown land revenue collapsed.' },
      { term: 'Commonwealth', definition: 'The republic that replaced the monarchy 1649-1660. Parliament sold off most Crown lands during this period.' },
      { term: 'Sequestration', definition: 'Parliament\'s seizure of Royalist property during the Civil War. Crown lands were sequestered and sold.' },
    ],
    territories: [
      { id: 'england', label: 'England', color: PALETTE.context, opacity: 0.12 },
      { id: 'duchy_lancaster_core', label: 'Duchy of Lancaster (survived)', color: PALETTE.lancaster, opacity: 0.35 },
      { id: 'duchy_cornwall', label: 'Duchy of Cornwall (survived)', color: PALETTE.cornwall, opacity: 0.2 },
      { id: 'salford_hundred', label: 'Salford Hundred', color: PALETTE.manchester, opacity: 0.25 },
    ],
    markers: [
      M.manchester,
      M.lancaster,
      M.london,
    ],
    camera: { longitude: -2.2, latitude: 53.5, height: 150000 },
    keyEntities: [
      { name: 'Charles I', role: 'King (executed 1649)', holds: 'Crown lands massively diminished by sales and seizures.' },
      { name: 'Oliver Cromwell', role: 'Lord Protector (1653-1658)', holds: 'Parliament sold off Crown lands. Duchy of Lancaster survived due to separate legal status.' },
      { name: 'Charles II', role: 'Restored King (1660)', holds: 'Recovered some Crown lands, but estate never fully rebuilt.' },
    ],
  },

  // ── Period 7: The Great Bargain of 1760 ──────────────────────────
  {
    id: 'great-bargain',
    yearStart: 1714,
    yearEnd: 1837,
    title: 'The Great Bargain of 1760',
    subtitle: 'The king surrenders Crown revenue — but keeps the Duchy',
    narrative: `By 1760, when George III came to the throne, Crown lands had been depleted by centuries of sales and seizures. Revenue was minimal, and the king depended heavily on Parliament for funding.

George III agreed to surrender Crown land revenue to the Treasury in exchange for a fixed annual payment called the Civil List. This created a formal separation between royal lands (now managed for public benefit) and the monarch's personal resources.

The Duchy of Lancaster was not included in this arrangement. Its distinct legal status — maintained since 1399 — meant it continued as the sovereign's private estate.

Three separate property structures emerged from this period:

1. Royal lands (later formalised as the Crown Estate in 1956) — revenue to the Treasury
2. The Duchy of Lancaster — revenue to the sovereign
3. The Duchy of Cornwall — revenue to the heir (established 1337)

The Crown Estate Acts of 1956 and 1961 placed the royal lands under independent commissioners. The Sovereign Grant Act 2011 replaced the Civil List with a percentage-based grant from Crown Estate profits.

In Manchester, the Salford Hundred's Court Leet continued operating under Duchy authority, though with diminishing powers as modern local government institutions emerged.`,
    glossary: [
      { term: 'Crown Estate', definition: 'The formal name (from 1956) for the royal lands George III surrendered in 1760. Managed by independent commissioners, with revenue going to the Treasury.' },
      { term: 'Civil List', definition: 'The fixed annual payment Parliament gave the sovereign in exchange for Crown land revenue. Replaced by the Sovereign Grant in 2012.' },
      { term: 'Sovereign Grant', definition: 'Since 2012, the sovereign receives a percentage (currently 12%) of Crown Estate profits, replacing the old Civil List.' },
      { term: 'Duchy of Lancaster', definition: 'The sovereign\'s private estate, not included in the 1760 arrangement. Revenue (~\u00a324M/year today) goes to the sovereign.' },
      { term: 'Duchy of Cornwall', definition: 'The heir\'s private estate, created 1337. Separate from the Crown Estate, with income (~\u00a323M/year) going to the Prince of Wales.' },
      { term: 'Crown Estate Commissioners', definition: 'The independent board that manages the Crown Estate on behalf of the nation.' },
    ],
    territories: [
      { id: 'england', label: 'England', color: PALETTE.context, opacity: 0.12 },
      { id: 'crown_estate_london', label: 'Royal Lands (London)', color: PALETTE.crownEstate, opacity: 0.4 },
      { id: 'crown_estate_windsor', label: 'Royal Lands (Windsor)', color: PALETTE.crownEstate, opacity: 0.35 },
      { id: 'duchy_lancaster_core', label: 'Duchy of Lancaster', color: PALETTE.lancaster, opacity: 0.35 },
      { id: 'duchy_cornwall', label: 'Duchy of Cornwall', color: PALETTE.cornwall, opacity: 0.25 },
      { id: 'salford_hundred', label: 'Salford Hundred (Duchy)', color: PALETTE.manchester, opacity: 0.25 },
    ],
    markers: [
      M.manchester,
      M.lancaster,
      M.london,
      M.windsor,
    ],
    camera: { longitude: -1.0, latitude: 52.5, height: 600000 },
    keyEntities: [
      { name: 'George III', role: 'King (1760-1820)', holds: 'Surrendered Crown land revenue to Parliament in exchange for the Civil List. Duchy of Lancaster remained separate.' },
      { name: 'Parliament', role: 'Legislature', holds: 'Received Crown land revenue. Pays the sovereign a Civil List (later Sovereign Grant).' },
    ],
  },

  // ── Period 8: The Modern Arrangement ─────────────────────────────
  {
    id: 'modern',
    yearStart: 1837,
    yearEnd: 2026,
    title: 'The Modern Arrangement',
    subtitle: 'Three separate property structures',
    narrative: `Today's system reflects nearly a thousand years of accumulated legal distinctions. The sovereign acts in multiple capacities, and royal property is divided into three separate structures with different governance.

The Crown Estate is a \u00a315.6 billion portfolio including Regent Street and St James's in London, offshore wind farms, roughly half the UK's seabed, and rural estates across the country. It is managed by independent commissioners, with all revenue going to the Treasury. The Sovereign Grant (currently 12% of Crown Estate profits) funds the monarchy.

The Duchy of Lancaster (~\u00a3679M in assets, ~18,400 hectares) generates approximately \u00a324M per year for the sovereign. The sovereign has voluntarily paid income tax on Duchy income since 1993. The assets cannot be sold and pass automatically to the next sovereign.

The Duchy of Cornwall (~\u00a31B in assets, ~53,000 hectares) operates on the same principle for the heir. Prince William currently holds it.

Manchester sits within the historic Salford Hundred, within the County Palatine of Lancaster, within the Duchy of Lancaster's jurisdiction. The Duchy's Court Leet in Salford finally ended in 1971, and magistrate appointments by the Duchy ended in 2005. Today, the Duchy appoints Manchester's High Sheriff and Lord Lieutenant (ceremonial roles), and collects bona vacantia (estates of people who die intestate without traceable relatives).

The roots of this three-part structure trace back to Henry IV's decision in 1399 to keep the Duchy of Lancaster separate from other Crown possessions — a distinction that survived every upheaval that followed.`,
    glossary: [
      { term: 'Crown Estate', definition: 'A \u00a315.6B property portfolio managed by independent commissioners since 1961. Revenue goes to the Treasury.' },
      { term: 'Sovereign Grant', definition: 'The sovereign\'s official funding — currently 12% of Crown Estate profits. Replaced the Civil List in 2012.' },
      { term: 'Duchy of Lancaster', definition: 'The sovereign\'s private estate (~\u00a3679M in assets). Generates ~\u00a324M/year. Assets pass automatically to the next sovereign.' },
      { term: 'Duchy of Cornwall', definition: 'The heir\'s private estate (~\u00a31B in assets). Same legal structure as Lancaster. Currently held by Prince William.' },
      { term: 'Bona vacantia', definition: 'Estates of people in the Duchy of Lancaster\'s jurisdiction who die intestate without traceable relatives pass to the sovereign as Duke of Lancaster.' },
      { term: 'Chancellor of the Duchy of Lancaster', definition: 'A cabinet minister whose role has evolved beyond Duchy administration. One of several medieval titles still in active government use.' },
    ],
    territories: [
      { id: 'england', label: 'England', color: PALETTE.context, opacity: 0.1 },
      { id: 'crown_estate_london', label: 'Royal Lands (London)', color: PALETTE.crownEstate, opacity: 0.4 },
      { id: 'crown_estate_windsor', label: 'Royal Lands (Windsor)', color: PALETTE.crownEstate, opacity: 0.35 },
      { id: 'duchy_lancaster_core', label: 'Duchy of Lancaster', color: PALETTE.lancaster, opacity: 0.35 },
      { id: 'duchy_lancaster_yorkshire', label: 'Duchy (Yorkshire)', color: PALETTE.lancaster, opacity: 0.25 },
      { id: 'duchy_lancaster_midlands', label: 'Duchy (Midlands)', color: PALETTE.lancaster, opacity: 0.25 },
      { id: 'duchy_lancaster_norfolk', label: 'Duchy (Norfolk)', color: PALETTE.lancaster, opacity: 0.25 },
      { id: 'duchy_cornwall', label: 'Duchy of Cornwall', color: PALETTE.cornwall, opacity: 0.3 },
      { id: 'salford_hundred', label: 'Salford Hundred', color: PALETTE.manchester, opacity: 0.3 },
    ],
    markers: [
      M.manchester,
      M.lancaster,
      M.london,
      M.windsor,
    ],
    camera: { longitude: -1.5, latitude: 52.5, height: 600000 },
    keyEntities: [
      { name: 'Charles III', role: 'King & Duke of Lancaster', holds: 'Duchy of Lancaster income (~\u00a324M/year). Sovereign Grant funded from Crown Estate revenue.' },
      { name: 'Prince William', role: 'Heir & Duke of Cornwall', holds: 'Duchy of Cornwall income (~\u00a323M/year). Will hold the Duchy of Lancaster as sovereign.' },
      { name: 'Crown Estate Commissioners', role: 'Independent board', holds: 'Manage the \u00a315.6B Crown Estate on behalf of the nation.' },
    ],
  },
];
