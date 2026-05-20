'use client';
import dynamic from 'next/dynamic';

const AgnosticRenderer = dynamic(
  () => import('../engine/AgnosticRenderer').then(m => m.AgnosticRenderer),
  { ssr: false }
);

interface Props {
  blocks?: any[];
  visual?: { cols?: number; gap?: number };
  record?: any;
}

export function AgnosticColumns({ blocks = [], visual, record }: Props) {
  const cols = Number(visual?.cols ?? 2);
  const gap  = Number(visual?.gap  ?? 6);

  const colMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div
      className={`grid w-full ${colMap[cols] || colMap[2]}`}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {blocks.map((block, i) => (
        <AgnosticRenderer key={block.id || i} block={block} record={record} />
      ))}
    </div>
  );
}
