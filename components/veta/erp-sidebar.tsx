'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LinkButton, Button } from '@/components/veta/button'
import { logoutEmpleadoAction } from '@/lib/auth/actions'
import {
  Briefcase,
  Contact,
  Calculator,
  Flag,
  Wrench,
  ShoppingCart,
  Hammer,
  BarChart3,
  Wallet,
  ClipboardList,
  Receipt,
  Package,
  Globe,
  Images,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useDataStore } from '@/lib/data'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

// Mismas etiquetas que app/erp/equipo/page.tsx (ROLES_ETIQUETAS) -- acá el footer mostraba
// usuario.rol crudo ("admin") en vez de la etiqueta humana ("Administrador") que el resto del
// ERP ya usa para el mismo dato (hallazgo de la re-auditoría D-02, 2026-08-10).
const ROLES_ETIQUETAS: Record<string, string> = {
  admin: 'Administrador',
  comercial: 'Comercial',
  desarrollador: 'Desarrollador',
  compras: 'Compras',
  taller: 'Taller',
  finanzas: 'Finanzas',
  supervisora_qa: 'Supervisora QA',
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const ERP_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/erp/comercial', label: 'Comercial', icon: <Briefcase className="h-5 w-5" /> },
      { href: '/erp/clientes', label: 'Clientes', icon: <Contact className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Producción',
    items: [
      { href: '/erp/cotizador', label: 'Cotizador', icon: <Calculator className="h-5 w-5" /> },
      { href: '/erp/gates', label: 'Gates y cronograma', icon: <Flag className="h-5 w-5" /> },
      { href: '/erp/taller', label: 'Taller', icon: <Wrench className="h-5 w-5" /> },
      { href: '/erp/compras', label: 'Compras', icon: <ShoppingCart className="h-5 w-5" /> },
      { href: '/erp/herramientas', label: 'Herramientas', icon: <Hammer className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/erp/finanzas', label: 'Finanzas', icon: <BarChart3 className="h-5 w-5" /> },
      { href: '/erp/finanzas/caja', label: 'Caja', icon: <Wallet className="h-5 w-5" /> },
      { href: '/erp/finanzas/obligaciones', label: 'Obligaciones', icon: <ClipboardList className="h-5 w-5" /> },
      { href: '/erp/finanzas/cuentas-cobro', label: 'Cuentas de cobro', icon: <Receipt className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Catálogo y tienda',
    items: [
      { href: '/erp/catalogo', label: 'Catálogo', icon: <Package className="h-5 w-5" /> },
      { href: '/erp/pedidos-web', label: 'Pedidos web', icon: <Globe className="h-5 w-5" /> },
      { href: '/erp/portafolio', label: 'Portafolio', icon: <Images className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Equipo',
    items: [
      { href: '/erp/equipo', label: 'Equipo', icon: <Users className="h-5 w-5" /> },
      { href: '/erp/garantia', label: 'Garantía', icon: <Shield className="h-5 w-5" /> },
    ],
  },
]

export function ErpSidebar() {
  const pathname = usePathname()
  const store = useDataStore()
  const usuario = store.auth.usuarioActual()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={`flex flex-col border-r border-border-subtle bg-bg-raised transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo section */}
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border-subtle px-4">
        {!isCollapsed && (
          <Link href="/erp/comercial" className="font-display text-lg font-semibold text-text-heading">
            <span className="text-brand">Veta</span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-sm p-1 text-text-muted hover:bg-bg-alt hover:text-text-primary"
          aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="ERP">
        {ERP_NAV_SECTIONS.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-4">
            {section.title && !isCollapsed && (
              <div className="mb-2 px-4 text-xs font-semibold uppercase text-text-muted tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = isItemActive(item.href)
              return (
                <LinkButton
                  key={item.href + item.label}
                  href={item.href}
                  variant={isActive ? 'primary' : 'ghost'}
                  size="md"
                  className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : 'px-3'}`}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </LinkButton>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User and badge section */}
      <div className="border-t border-border-subtle bg-bg-paper p-4">
        {!isCollapsed && (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs text-brand font-mono bg-gold-100/80 px-2 py-0.5 rounded-full">
                PROTOTIPO
              </span>
            </div>
            <div className="text-xs text-text-muted text-center">
              <p className="font-medium text-text-primary mb-1">{usuario.nombre}</p>
              <p className="text-text-muted">{ROLES_ETIQUETAS[usuario.rol] ?? usuario.rol}</p>
            </div>
            <form action={logoutEmpleadoAction} className="mt-3">
              <Button type="submit" variant="ghost" size="md" className="w-full justify-center text-xs">
                Cerrar sesión
              </Button>
            </form>
          </>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center">
            <span className="text-xs text-brand font-mono bg-gold-100/80 px-1.5 py-0.5 rounded-full">
              P
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
