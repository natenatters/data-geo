export interface HistoricalEvent {
  year: number;
  label: string;
  short?: string; // abbreviated label for tight spaces
}

export const MANCHESTER_EVENTS: HistoricalEvent[] = [
  { year: 79, label: 'Roman fort (Mamucium)', short: 'Mamucium' },
  { year: 197, label: 'Fort gate rebuilt under Severus', short: 'Fort rebuilt' },
  { year: 250, label: 'Vicus (civilian settlement) abandoned', short: 'Vicus dies' },
  { year: 340, label: 'Last coins at Mamucium — garrison ends', short: 'Garrison ends' },
  { year: 410, label: 'Romans leave Britain', short: 'Romans leave' },
  { year: 620, label: 'Anglo-Saxon settlement on Irk/Irwell', short: 'Saxons settle' },
  { year: 793, label: 'Vikings raid Lindisfarne', short: 'Vikings' },
  { year: 919, label: 'Edward the Elder fortifies Mameceastre', short: 'Mameceastre' },
  { year: 1066, label: 'Norman Conquest', short: 'Normans' },
  { year: 1301, label: 'Market charter granted', short: 'Charter' },
  { year: 1421, label: 'Collegiate church founded', short: 'Cathedral' },
  { year: 1653, label: 'Civil War siege of Manchester', short: 'Siege' },
  { year: 1761, label: 'Bridgewater Canal opens', short: 'Canal' },
  { year: 1819, label: 'Peterloo Massacre', short: 'Peterloo' },
  { year: 1830, label: 'Liverpool-Manchester Railway', short: 'Railway' },
  { year: 1894, label: 'Ship Canal opens', short: 'Ship Canal' },
  { year: 1940, label: 'Manchester Blitz', short: 'Blitz' },
  { year: 1996, label: 'IRA bombing / city centre rebuild', short: 'IRA bomb' },
];
