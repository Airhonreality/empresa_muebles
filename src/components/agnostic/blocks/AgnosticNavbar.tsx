'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  nav_id?: string;
  // Fallback: links inline en el bloque
  links?: { label: string; path: string; icon?: string }[];
  brand?: { label: string; path: string };
}

export function AgnosticNavbar({ nav_id, links: inlineLinks, brand }: Props) {
  const pathname = usePathname();
  const { data: navbarsData } = useRelationData(nav_id ? 'app_navbars' : null);

  // Resolver config: inline > nav_id lookup
  const navConfig = nav_id
    ? (navbarsData || []).find((r: any) => r.data?.name === nav_id)?.data
    : null;

  const links = inlineLinks || navConfig?.links || [];
  const brandConfig = brand || navConfig?.brand;

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="flex items-center gap-6 px-6 h-14">
        {brandConfig && (
          <Link href={brandConfig.path} className="font-black text-sm tracking-tight uppercase">
            {brandConfig.label}
          </Link>
        )}
        <div className="flex items-center gap-1">
          {links.map((link: any) => {
            const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
            const IconComp = link.icon && link.icon in Icons ? (Icons as any)[link.icon] : null;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {IconComp && <IconComp className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
