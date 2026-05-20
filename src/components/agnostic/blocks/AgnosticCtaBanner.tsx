'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  visual?: {
    headline?: string;
    sub?: string;
    cta_label?: string;
    cta_href?: string;
    variant?: 'primary' | 'muted';
  };
}

export function AgnosticCtaBanner({ visual }: Props) {
  const { headline, sub, cta_label, cta_href = '#', variant = 'primary' } = visual || {};

  return (
    <section className={cn(
      "w-full rounded-2xl p-12 text-center flex flex-col items-center gap-6",
      variant === 'primary' ? "bg-primary text-primary-foreground" : "bg-muted/30 border border-border"
    )}>
      {headline && <h2 className="text-3xl font-black tracking-tight max-w-2xl">{headline}</h2>}
      {sub && <p className={cn("text-sm max-w-md", variant === 'primary' ? "opacity-80" : "text-muted-foreground")}>{sub}</p>}
      {cta_label && (
        <Button
          asChild
          size="lg"
          variant={variant === 'primary' ? 'secondary' : 'default'}
          className="font-bold uppercase tracking-wider"
        >
          <Link href={cta_href}>{cta_label}</Link>
        </Button>
      )}
    </section>
  );
}
