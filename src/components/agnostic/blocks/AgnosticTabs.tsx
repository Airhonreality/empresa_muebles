'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import * as Icons from 'lucide-react';

const AgnosticRenderer = dynamic(
  () => import('../engine/AgnosticRenderer').then(m => m.AgnosticRenderer),
  { ssr: false, loading: () => <div className="h-20 animate-pulse bg-muted/10 rounded-lg" /> }
);

interface Props {
  blocks?: any[];
  record?: any;
  parentId?: string;
  parentKey?: string;
  intent?: string;
  default_tab?: string;
}

export function AgnosticTabs({ blocks = [], record, parentId, parentKey, intent, default_tab }: Props) {
  const tabs = blocks.filter(b => b.tab_label);
  const [active, setActive] = useState(default_tab || tabs[0]?.id || tabs[0]?.tab_label || '');

  if (!tabs.length) return null;

  return (
    <Tabs value={active} onValueChange={setActive} className="w-full">
      <TabsList className="mb-6 h-10 bg-muted/50">
        {tabs.map(tab => {
          const IconComp = tab.tab_icon && tab.tab_icon in Icons
            ? (Icons as any)[tab.tab_icon]
            : null;
          const key = tab.id || tab.tab_label;
          return (
            <TabsTrigger
              key={key}
              value={key}
              className="text-[11px] font-bold uppercase tracking-wider gap-2"
            >
              {IconComp && <IconComp className="w-3.5 h-3.5" />}
              {tab.tab_label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map(tab => {
        const key = tab.id || tab.tab_label;
        return (
          <TabsContent key={key} value={key}>
            <AgnosticRenderer
              block={tab}
              record={record}
              parentId={parentId}
              parentKey={parentKey}
              intent={intent as any}
            />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
