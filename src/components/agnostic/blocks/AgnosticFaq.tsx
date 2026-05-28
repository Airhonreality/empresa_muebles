import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FaqItem { q: string; a: string }
interface Props {
  visual?: { title?: string; items?: FaqItem[] };
  items?: FaqItem[];
}

export function AgnosticFaq({ visual, items: propItems }: Props) {
  const items = propItems || visual?.items || [];
  const title = visual?.title;

  return (
    <div className="w-full space-y-4">
      {title && <h2 className="text-2xl font-bold tracking-tight mb-6">{title}</h2>}
      <Accordion type="single" collapsible className="w-full space-y-2">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-border/50 rounded-xl px-4 bg-muted/10"
          >
            <AccordionTrigger className="text-sm font-bold uppercase tracking-wide hover:no-underline py-4">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
