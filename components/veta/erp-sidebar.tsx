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
  MessageSquare,
  Layers,
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
      { href: '/erp/comercial', label: 'Comercial', icon: <Briefcase className="h-4 w-4" /> },
      { href: '/erp/clientes', label: 'Clientes', icon: <Contact className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Producción',
    items: [
      { href: '/erp/cotizador', label: 'Cotizador', icon: <Calculator className="h-4 w-4" /> },
      { href: '/erp/gates', label: 'Gates y cronograma', icon: <Flag className="h-4 w-4" /> },
      { href: '/erp/taller', label: 'Taller', icon: <Wrench className="h-4 w-4" /> },
      { href: '/erp/compras', label: 'Compras', icon: <ShoppingCart className="h-4 w-4" /> },
      { href: '/erp/herramientas', label: 'Herramientas', icon: <Hammer className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/erp/finanzas', label: 'Finanzas', icon: <BarChart3 className="h-4 w-4" /> },
      { href: '/erp/finanzas/caja', label: 'Caja', icon: <Wallet className="h-4 w-4" /> },
      { href: '/erp/finanzas/obligaciones', label: 'Obligaciones', icon: <ClipboardList className="h-4 w-4" /> },
      { href: '/erp/finanzas/cuentas-cobro', label: 'Cuentas de cobro', icon: <Receipt className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Catálogo y tienda',
    items: [
      { href: '/erp/catalogo', label: 'Catálogo', icon: <Package className="h-4 w-4" /> },
      { href: '/erp/pedidos-web', label: 'Pedidos web', icon: <Globe className="h-4 w-4" /> },
      { href: '/erp/portafolio', label: 'Portafolio', icon: <Images className="h-4 w-4" /> },
      { href: '/erp/portafolio/testimonios', label: 'Testimonios', icon: <MessageSquare className="h-4 w-4" /> },
      { href: '/erp/catalogos/espacios-arquitectonicos', label: 'Espacios arquitectónicos', icon: <Layers className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Equipo',
    items: [
      { href: '/erp/equipo', label: 'Equipo', icon: <Users className="h-4 w-4" /> },
      { href: '/erp/garantia', label: 'Garantía', icon: <Shield className="h-4 w-4" /> },
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
      className={`flex flex-col border-r border-border-subtle bg-bg-raised transition-all duration-300 h-screen sticky top-0 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo section */}
      <div className="flex h-12 items-center justify-between gap-2 border-b border-border-subtle px-3 shrink-0">
        {!isCollapsed && (
          <Link href="/erp/comercial" className="font-display text-base font-semibold text-text-heading truncate">
            <span className="text-brand">Veta</span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-sm p-1 text-text-muted hover:bg-bg-alt hover:text-text-primary"
          aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 thin-scrollbar" aria-label="ERP">
        {ERP_NAV_SECTIONS.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-3">
            {section.title && !isCollapsed && (
              <div className="mb-1 px-2 text-[10px] font-bold uppercase text-text-muted tracking-widest">
                {section.title}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = isItemActive(item.href)
                return (
                  <LinkButton
                    key={item.href + item.label}
                    href={item.href}
                    variant={isActive ? 'primary' : 'ghost'}
                    size="md"
                    className={`w-full justify-start gap-2 h-7 px-2 text-[13px] ${isCollapsed ? 'justify-center px-1' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </LinkButton>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User and badge section */}
      <div className="border-t border-border-subtle bg-bg-paper p-3 shrink-0">
        {!isCollapsed && (
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-brand font-mono bg-gold-100/80 px-1.5 py-0.5 rounded-full">
                PROTOTIPO
              </span>
            </div>
            <div className="text-[11px] text-text-muted">
              <p className="font-medium text-text-primary truncate">{usuario.nombre}</p>
              <p className="text-text-muted truncate">{ROLES_ETIQUETAS[usuario.rol] ?? usuario.rol}</p>
            </div>
            <form action={logoutEmpleadoAction} className="mt-2">
              <Button type="submit" variant="ghost" size="md" className="w-full justify-center text-[11px] h-6">
                Cerrar sesión
              </Button>
            </form>
          </>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center">
            <span className="text-[10px] text-brand font-mono bg-gold-100/80 px-1.5 py-0.5 rounded-full">
              P
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
