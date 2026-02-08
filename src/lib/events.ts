export interface HistoricalEvent {
  year: number;
  label: string;
  short?: string; // abbreviated label for tight spaces
}

export const MANCHESTER_EVENTS: HistoricalEvent[] = [
  { year: 79, label: 'Roman fort (Mamucium)', short: 'Mamucium' },
  { year: 1301, label: 'Market charter granted', short: 'Charter' },
  { year: 1421, label: 'Collegiate church founded', short: 'Cathedral' },
  { year: 1653, label: 'Civil War siege of Manchester', short: 'Siege' },
  { year: 1761, label: 'Bridgewater Canal opens', short: 'Canal' },
  { year: 1764, label: 'Spinning Jenny invented', short: 'Jenny' },
  { year: 1781, label: 'First steam-powered cotton mill', short: 'Steam mill' },
  { year: 1819, label: 'Peterloo Massacre', short: 'Peterloo' },
  { year: 1830, label: 'Liverpool-Manchester Railway', short: 'Railway' },
  { year: 1853, label: 'City status granted', short: 'City' },
  { year: 1894, label: 'Ship Canal opens', short: 'Ship Canal' },
  { year: 1910, label: 'Trafford Park industrial estate', short: 'Trafford Pk' },
  { year: 1940, label: 'Manchester Blitz', short: 'Blitz' },
  { year: 1962, label: 'Ringway Airport (now MAN)', short: 'Airport' },
  { year: 1996, label: 'IRA bombing / city centre rebuild', short: 'IRA bomb' },
];
