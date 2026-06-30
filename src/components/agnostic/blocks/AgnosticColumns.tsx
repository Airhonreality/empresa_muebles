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

  const minByCols: Record<number, string> = {
    1: '100%',
    2: 'min(100%, 24rem)',
    3: 'min(100%, 18rem)',
    4: 'min(100%, 14rem)',
  };

  return (
    <div
      className="@container grid w-full"
      style={{
        gap: `${gap * 0.25}rem`,
        gridTemplateColumns: `repeat(auto-fit, minmax(${minByCols[cols] || minByCols[2]}, 1fr))`,
      }}
    >
      {blocks.map((block, i) => (
        <AgnosticRenderer key={block.id || i} block={block} record={record} />
      ))}
    </div>
  );
}
