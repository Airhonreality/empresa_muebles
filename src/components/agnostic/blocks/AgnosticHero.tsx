'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  visual?: {
    title?: string;
    subtitle?: string;
    align?: 'left' | 'center';
    cta?: { label: string; path: string };
    cta_secondary?: { label: string; path: string };
    cta_label?: string;
    cta_path?: string;
    cta_secondary_label?: string;
    cta_secondary_path?: string;
    className?: string;
  };
}

export function AgnosticHero({ visual }: Props) {
  const { title, subtitle, align = 'center', className } = visual || {};
  const cta = visual?.cta || (visual?.cta_label ? { label: visual.cta_label, path: visual.cta_path || '#' } : undefined);
  const cta_secondary = visual?.cta_secondary || (visual?.cta_secondary_label ? { label: visual.cta_secondary_label, path: visual.cta_secondary_path || '#' } : undefined);

  return (
    <section className={cn(
      "py-24 px-6 w-full",
      align === 'center' && 'text-center flex flex-col items-center',
      className
    )}>
      {title && (
        <h1 className="text-6xl font-black tracking-tighter max-w-3xl mb-4">{title}</h1>
      )}
      {subtitle && (
        <p className="text-lg text-muted-foreground max-w-xl mb-10">{subtitle}</p>
      )}
      {(cta || cta_secondary) && (
        <div className="flex gap-4 flex-wrap justify-center">
          {cta && (
            <Button asChild size="lg" className="font-bold uppercase tracking-wider">
              <Link href={cta.path}>{cta.label}</Link>
            </Button>
          )}
          {cta_secondary && (
            <Button asChild size="lg" variant="outline" className="font-bold uppercase tracking-wider">
              <Link href={cta_secondary.path}>{cta_secondary.label}</Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
