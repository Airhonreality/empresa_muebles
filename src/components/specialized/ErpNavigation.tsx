'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  ChevronRight,
  Factory,
  FolderKanban,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'

const navigation = [
  { label: 'Inicio', href: '/app', icon: LayoutDashboard, exact: true },
  { label: 'Proyectos y ventas', href: '/app/erp/comercial', icon: FolderKanban },
  { label: 'Cotizador', href: '/app/erp/cotizador', icon: ReceiptText },
  { label: 'Taller y producción', href: '/app/erp/taller', icon: Factory },
  { label: 'Finanzas', href: '/app/erp/finanzas', icon: Wallet },
  { label: 'Catálogo', href: '/app/erp/catalogo', icon: PackageSearch },
  { label: 'Proveedores', href: '/app/erp/proveedores', icon: ShoppingCart },
  { label: 'Calendario', href: '/app/erp/calendar', icon: CalendarDays },
  { label: 'Equipo', href: '/app/erp/equipo', icon: Users },
]

export default function ErpNavigation() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/app" className="min-w-0">
          <span className="block text-sm font-black tracking-[0.16em] text-foreground">VETA DORADA</span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ERP operativo</span>
        </Link>
      </div>
      <nav aria-label="Navegación ERP" className="flex-1 space-y-1 p-3">
        {navigation.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                active
                  ? 'bg-stone-950 font-semibold text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {active ? <ChevronRight className="h-3.5 w-3.5 opacity-70" /> : null}
            </Link>
          )
        })}
      </nav>
      <div className="border-t px-5 py-4 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Operación integrada por proyecto
      </div>
    </aside>
  )
}
