'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Calculator, BarChart3, Menu } from 'lucide-react'
import { ErpSidebar } from '@/components/veta/erp-sidebar'
import { ErpMobileMenu } from '@/components/veta/erp-mobile-menu'

export function ErpShell({ children, usuario }: { children: React.ReactNode; usuario: { nombre: string; rol: string } | null }) {
  // /erp/login y /erp/login/activar (D-08b, F10 2026-08-15) son las únicas
  // rutas de /erp/** sin sesión (middleware.ts las deja pasar) — el sidebar
  // no tiene sentido ahí (todos sus links redirigirían de vuelta al login).
  const pathname = usePathname()
  const esLogin = pathname === '/erp/login' || pathname.startsWith('/erp/login/')
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Cierra el drawer al cambiar de ruta.
  useEffect(() => {
    setMenuAbierto(false)
  }, [pathname])

  if (esLogin) {
    return <div className="min-h-screen bg-surface-100">{children}</div>
  }

  const itemActivo = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className={`min-h-screen flex flex-col bg-surface-100 ${pathname.startsWith('/erp/') ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0' : 'pb-14 md:pb-0'}`}>
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="hidden md:block print:hidden">
          <ErpSidebar usuario={usuario} />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 min-w-0" id="erp-content">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border-subtle bg-bg-paper hidden md:block print:hidden">
            <div className="mx-auto px-6 py-4 text-center text-xs text-text-muted">
              ERP Hermanos García González S.A.S. · Datos de prueba
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-bg-raised border-t border-border-subtle h-14 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden">
        <Link
          href="/erp/comercial"
          className={`p-2 flex flex-col items-center gap-1 ${itemActivo('/erp/comercial') ? 'text-gold-500' : 'text-text-muted'}`}
          aria-current={itemActivo('/erp/comercial') ? 'page' : undefined}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] font-medium">Comercial</span>
        </Link>
        <Link
          href="/erp/cotizador"
          className={`p-2 flex flex-col items-center gap-1 ${itemActivo('/erp/cotizador') ? 'text-gold-500' : 'text-text-muted'}`}
          aria-current={itemActivo('/erp/cotizador') ? 'page' : undefined}
        >
          <Calculator className="w-5 h-5" />
          <span className="text-[10px] font-medium">Cotizador</span>
        </Link>
        <Link
          href="/erp/finanzas"
          className={`p-2 flex flex-col items-center gap-1 ${itemActivo('/erp/finanzas') ? 'text-gold-500' : 'text-text-muted'}`}
          aria-current={itemActivo('/erp/finanzas') ? 'page' : undefined}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Finanzas</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          className="p-2 flex flex-col items-center gap-1 text-text-muted hover:text-gold-500"
          aria-label="Menú"
          aria-expanded={menuAbierto}
          aria-haspopup="dialog"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menú</span>
        </button>
      </div>

      {/* Mobile navigation drawer */}
      <ErpMobileMenu open={menuAbierto} onClose={() => setMenuAbierto(false)} />
    </div>
  )
}
