import { Badge } from '@/components/veta/badge';

const tones = ['neutral', 'danger', 'warning', 'info'] as const;
const variants = ['glass', 'material', 'mist'] as const;

export default function BadgeMockupsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12">
        <h1 className="font-display text-3xl font-semibold text-text-heading">
          Badge Solar Punk — Mockups C2 PoC 3
        </h1>
        <p className="mt-2 text-text-muted">
          3 variantes visuales × 4 tonos semánticos. Variante <code className="bg-bg-alt px-1 rounded">mist</code> tiene micro-motion hover (glow + pulse dot).
        </p>
      </header>

      {variants.map((variant) => (
        <section key={variant} className="mb-16">
          <h2 className="mb-6 font-display text-xl font-semibold text-text-heading capitalize">
            Variante: {variant}
          </h2>
          <div className="flex flex-wrap gap-4">
            {tones.map((tone) => (
              <div key={tone} className="flex flex-col items-start gap-2 p-4 rounded-md bg-bg-raised border border-border-subtle min-w-[180px]">
                <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  tone: {tone}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[false, true].map((dot) => (
                    <Badge key={String(dot)} tone={tone} variant={variant} dot={dot}>
                      {dot ? `${tone}·dot` : tone}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="border-t border-border-subtle pt-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-text-heading">
          Estados interactivos (hover/focus)
        </h2>
        <div className="flex flex-wrap gap-4">
          {variants.map((variant) => (
            <div key={variant} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-muted">{variant}</span>
              <div className="flex gap-2">
                {tones.map((tone) => (
                  <Badge key={tone} tone={tone} variant={variant} dot>
                    {tone}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}