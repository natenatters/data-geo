import fs from 'fs';
import path from 'path';
import StoryDetail from './StoryDetail';

export function generateStaticParams() {
  const storiesPath = path.join(process.cwd(), 'public', 'data', 'stories.json');
  if (!fs.existsSync(storiesPath)) return [];
  const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf-8'));
  return stories.map((s: { id: number }) => ({ id: String(s.id) }));
}

export default function StoryDetailPage({ params }: { params: { id: string } }) {
  return <StoryDetail id={params.id} />;
}
