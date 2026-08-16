'use client'

import { usePathname } from 'next/navigation'
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
    <div className="min-h-screen flex flex-col bg-surface-100">
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <ErpSidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 min-w-0" id="erp-content">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border-subtle bg-bg-paper">
            <div className="mx-auto px-6 py-4 text-center text-xs text-text-muted">
              ERP Hermanos García González S.A.S. · Datos de prueba
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
