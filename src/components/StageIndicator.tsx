import { STAGES } from '@/lib/types';

const stageColors: Record<number, string> = {
  1: 'bg-gray-500',
  2: 'bg-blue-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
};

export default function StageIndicator({ stage, size = 'sm' }: { stage: number; size?: 'sm' | 'lg' }) {
  if (size === 'lg') {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
              s <= stage ? stageColors[s] : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            <span className={`text-xs ${s <= stage ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {STAGES[s]}
            </span>
            {s < 4 && <div className={`w-8 h-0.5 ${s < stage ? stageColors[s] : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${stageColors[stage]}`}>
      {stage}. {STAGES[stage]}
    </span>
  );
}
