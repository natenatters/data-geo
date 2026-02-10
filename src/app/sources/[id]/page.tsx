import fs from 'fs';
import path from 'path';
import SourceDetail from './SourceDetail';

export function generateStaticParams() {
  const sourcesPath = path.join(process.cwd(), 'public', 'data', 'sources.json');
  if (!fs.existsSync(sourcesPath)) return [];
  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
  return sources.map((s: { id: number }) => ({ id: String(s.id) }));
}

export default function SourceDetailPage({ params }: { params: { id: string } }) {
  return <SourceDetail id={params.id} />;
}
