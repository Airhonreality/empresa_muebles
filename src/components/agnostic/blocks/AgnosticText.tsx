import { cn } from '@/lib/utils';

const VARIANT_STYLES: Record<string, string> = {
  h1:      "text-5xl font-black tracking-tighter",
  h2:      "text-3xl font-bold tracking-tight",
  h3:      "text-xl font-bold",
  body:    "text-base text-muted-foreground leading-relaxed",
  caption: "text-xs font-bold uppercase tracking-widest text-muted-foreground",
  label:   "text-sm font-semibold",
  quote:   "text-xl italic border-l-4 border-primary pl-4 text-muted-foreground",
};

interface Props {
  visual?: { variant?: string; content?: string; align?: string; className?: string };
  content?: string;
  variant?: string;
}

export function AgnosticText({ visual, content: propContent, variant: propVariant }: Props) {
  const content = propContent || visual?.content || '';
  const variant = propVariant || visual?.variant || 'body';
  const align   = visual?.align || 'left';

  return (
    <p className={cn(
      VARIANT_STYLES[variant] || VARIANT_STYLES.body,
      align === 'center' && 'text-center',
      align === 'right'  && 'text-right',
      visual?.className
    )}>
      {content}
    </p>
  );
}
