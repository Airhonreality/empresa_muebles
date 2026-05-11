'use client';

import { useAppContext } from '@/context/AppContext';
import type { DataItem } from '@agnostic/core';
import styles from './PageComposer.module.css';

export interface Block {
  type: 'heading' | 'text' | 'image' | 'grid' | 'data-table';
  content?: string;
  src?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  context?: string;
}

interface Props {
  blocks: Block[];
}

export function PageComposer({ blocks }: Props) {
  const { state } = useAppContext();

  return (
    <div className={styles.composer}>
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} data={state.data} />
      ))}
    </div>
  );
}

function BlockRenderer({
  block,
  data,
}: {
  block: Block;
  data: Record<string, DataItem[]>;
}) {
  switch (block.type) {
    case 'heading': {
      const level = block.level ?? 2;
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return <Tag className={styles.heading}>{block.content}</Tag>;
    }
    case 'text':
      return <p className={styles.text}>{block.content}</p>;

    case 'image':
      return (
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.image} src={block.src} alt={block.content ?? ''} />
        </div>
      );

    case 'grid':
    case 'data-table': {
      const items = block.context ? (data[block.context] ?? []) : [];
      if (items.length === 0) {
        return <div className={styles.empty}>No data in context &ldquo;{block.context}&rdquo;</div>;
      }
      return (
        <div className={styles.grid}>
          {items.map(item => (
            <DataCard key={item.id} item={item} />
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

function DataCard({ item }: { item: DataItem }) {
  return (
    <div className={styles.card}>
      {Object.entries(item.data).map(([k, v]) => (
        <div key={k} className={styles.cardRow}>
          <span className={styles.cardKey}>{k}</span>
          <span className={styles.cardValue}>{String(v ?? '')}</span>
        </div>
      ))}
    </div>
  );
}
