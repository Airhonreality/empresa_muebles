import type { Metadata } from 'next'

// Portal cliente (F-07): contenido privado por sesión, no indexable — mismo criterio que
// /erp/** (app/erp/layout.tsx). Sin noindex, Google podía indexar /cuenta/login y el resto
// (hallazgo auditoría SEO 2026-08-19, corregía un comentario falso en app/robots.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return children
}