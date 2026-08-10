'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/veta/button'
import { useDataStore } from '@/lib/data'

const ERP_NAV = [
  { href: '/erp/comercial', label: 'Comercial' },
  { href: '/erp/cotizador', label: 'Cotizador' },
  { href: '/erp/gates', label: 'Gates' },
  { href: '/erp/equipo', label: 'Equipo' },
  { href: '/erp/finanzas', label: 'Finanzas' },
  { href: '/erp/finanzas/caja', label: 'Caja' },
  { href: '/erp/finanzas/obligaciones', label: 'Obligaciones' },
  { href: '/erp/finanzas/cuentas-cobro', label: 'Cuentas de cobro' },
  { href: '/erp/taller', label: 'Taller' },
  { href: '/erp/garantia', label: 'Garantía' },
  { href: '/erp/catalogo', label: 'Catálogo' },
  { href: '/erp/compras', label: 'Compras' },
  { href: '/erp/herramientas', label: 'Herramientas' },
  { href: '/erp/pedidos-web', label: 'Pedidos web' },
] as const

export function ErpShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const store = useDataStore()
  const usuario = store.auth.usuarioActual()

  return (
    <div className="min-h-screen flex flex-col bg-surface-100">
      <header className="border-b border-border-subtle bg-bg-raised/90 backdrop-blur-sm sticky top-0 z-nav">
        <div className="mx-auto flex h-14 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <Link href="/erp/comercial" className="font-display text-lg font-semibold text-text-heading">
              <span className="text-brand">Veta</span> Dorada
            </Link>
            <nav className="hidden md:flex items-center gap-1" aria-label="ERP">
              {ERP_NAV.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'primary' : 'ghost'}
                      size="md"
                      className="gap-2"
                    >
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand font-mono bg-gold-100/80 px-2 py-0.5 rounded-full">
              PROTOTIPO
            </span>
            <span className="text-sm text-text-muted">
              {usuario.nombre} · {usuario.rol}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1" id="erp-content">
        {children}
      </main>

      <footer className="border-t border-border-subtle bg-bg-paper">
        <div className="mx-auto px-6 py-4 text-center text-xs text-text-muted">
          ERP Hermanos García González S.A.S. · Prototipo B1 · Mock Data
        </div>
      </footer>
    </div>
  )
}
