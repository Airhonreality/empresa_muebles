import * as Icons from 'lucide-react';

interface StatItem {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface Props {
  visual?: { items?: StatItem[]; cols?: number };
  items?: StatItem[];
}

export function AgnosticStatsGrid({ visual, items: propItems }: Props) {
  const items = propItems || visual?.items || [];
  const cols  = Number(visual?.cols) || items.length || 3;

  const colClass: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${colClass[cols] || colClass[3]} gap-8`}>
      {items.map((item, i) => {
        const IconComp = item.icon && item.icon in Icons ? (Icons as any)[item.icon] : null;
        return (
          <div key={i} className="text-center space-y-1">
            {IconComp && <IconComp className="w-6 h-6 mx-auto text-primary/60 mb-2" />}
            <div className="text-4xl font-black tracking-tighter text-foreground">{item.value}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.label}</div>
            {item.description && <p className="text-xs text-muted-foreground/60">{item.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
