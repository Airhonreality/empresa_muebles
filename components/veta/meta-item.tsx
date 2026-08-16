import type { LucideIcon } from 'lucide-react';

interface MetaItemProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

/* Primitiva MetaItem (D-01, diseno_web_publica_diamante.md).
   Metadata editorial: ícono + texto, nunca un Badge. El Badge (rating "●4.8", tono e-commerce)
   es el patrón del ERP (dashboard, material) — acá se muestra información de contexto
   (ubicación, fecha, categoría) con el mismo peso visual discreto que usa vetadeoro.co hoy. */
export function MetaItem({ icon: Icon, children }: MetaItemProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
      <Icon aria-hidden size={16} strokeWidth={1.75} className="shrink-0 text-gold-400" />
      {children}
    </span>
  );
}
