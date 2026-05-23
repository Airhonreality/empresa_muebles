'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData';

interface Props {
  context: string;              // entity name, e.g. "nav_links"
  grupo?: string;               // optional filter: only records where data.grupo === grupo
  brand_label?: string;
  brand_path?: string;
  direction?: 'horizontal' | 'vertical';
  show_border?: boolean;
}

export function AgnosticNav({
  context,
  grupo,
  brand_label,
  brand_path = '/',
  direction = 'horizontal',
  show_border = true,
}: Props) {
  const pathname = usePathname();
  const { data } = useRelationData(context);

  let links = (data || []).map((r: any) => r.data).filter(Boolean);
  if (grupo) links = links.filter((l: any) => l.grupo === grupo);
  links = links.sort((a: any, b: any) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

  const isVertical = direction === 'vertical';

  return (
    <nav className={cn(
      'bg-background/95 backdrop-blur-sm w-full',
      show_border && (isVertical ? 'border-r border-border/50' : 'border-b border-border/50'),
    )}>
      <div className={cn(
        'flex items-center gap-1 px-4',
        isVertical ? 'flex-col items-start py-4 h-full gap-0.5' : 'flex-row h-14',
      )}>
        {brand_label && (
          <Link
            href={brand_path}
            className={cn(
              'font-black text-sm tracking-tight uppercase text-foreground',
              isVertical ? 'mb-4 px-3 py-1.5' : 'mr-4',
            )}
          >
            {brand_label}
          </Link>
        )}

        {links.map((link: any) => {
          const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path + '/'));
          const IconComp = link.icon && link.icon in Icons ? (Icons as any)[link.icon] : null;
          return (
            <Link
              key={link.path || link.label}
              href={link.path || '#'}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors w-full',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              {IconComp && <IconComp className="w-3.5 h-3.5 shrink-0" />}
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
