'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Calculator, Package, Menu } from 'lucide-react'
import { ErpSidebar } from '@/components/veta/erp-sidebar'

export function ErpShell({ children }: { children: React.ReactNode }) {
  // /erp/login y /erp/login/activar (D-08b, F10 2026-08-15) son las únicas
  // rutas de /erp/** sin sesión (middleware.ts las deja pasar) — el sidebar
  // no tiene sentido ahí (todos sus links redirigirían de vuelta al login).
  const pathname = usePathname()
  const esLogin = pathname === '/erp/login' || pathname.startsWith('/erp/login/')

  if (esLogin) {
    return <div className="min-h-screen bg-surface-100">{children}</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-100 pb-14 md:pb-0">
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="hidden md:block">
          <ErpSidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 min-w-0" id="erp-content">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border-subtle bg-bg-paper hidden md:block">
            <div className="mx-auto px-6 py-4 text-center text-xs text-text-muted">
              ERP Hermanos García González S.A.S. · Datos de prueba
            </div>
          </footer>
        </div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-bg-raised border-t border-border-subtle h-14 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link href="/erp/comercial" className="p-2 text-text-muted hover:text-gold-500 flex flex-col items-center gap-1">
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] font-medium">Comercial</span>
        </Link>
        <Link href="/erp/cotizador" className="p-2 text-text-muted hover:text-gold-500 flex flex-col items-center gap-1">
          <Calculator className="w-5 h-5" />
          <span className="text-[10px] font-medium">Cotizador</span>
        </Link>
        <Link href="/erp/catalogo" className="p-2 text-text-muted hover:text-gold-500 flex flex-col items-center gap-1">
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-medium">Catálogo</span>
        </Link>
        <button className="p-2 text-text-muted hover:text-gold-500 flex flex-col items-center gap-1">
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menú</span>
        </button>
      </div>
    </div>
  )
}
