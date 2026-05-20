import { Card, CardContent } from '@/components/ui/card';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  visual?: { icon?: string; title?: string; body?: string; variant?: string };
}

export function AgnosticCardStatic({ visual }: Props) {
  const { icon, title, body, variant = 'bordered' } = visual || {};
  const IconComp = icon && icon in Icons ? (Icons as any)[icon] : null;

  return (
    <Card className={cn(
      "h-full",
      variant === 'ghost' && "border-none shadow-none bg-transparent"
    )}>
      <CardContent className="p-6 space-y-3">
        {IconComp && <IconComp className="w-8 h-8 text-primary" />}
        {title && <h3 className="font-bold text-base tracking-tight">{title}</h3>}
        {body  && <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>}
      </CardContent>
    </Card>
  );
}
