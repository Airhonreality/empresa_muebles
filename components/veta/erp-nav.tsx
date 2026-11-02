import {
  Briefcase,
  Contact,
  Calculator,
  Wrench,
  ShoppingCart,
  Hammer,
  BarChart3,
  ClipboardList,
  Receipt,
  Package,
  Palette,
  Building2,
  Globe,
  Images,
  Users,
  Shield,
  MessageSquare,
  Layers,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const ERP_NAV_SECTIONS: NavSection[] = [
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
      { href: '/erp/taller', label: 'Taller', icon: <Wrench className="h-4 w-4" /> },
      { href: '/erp/compras', label: 'Compras', icon: <ShoppingCart className="h-4 w-4" /> },
      { href: '/erp/herramientas', label: 'Herramientas', icon: <Hammer className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/erp/finanzas', label: 'Finanzas', icon: <BarChart3 className="h-4 w-4" /> },
      { href: '/erp/finanzas/obligaciones', label: 'Obligaciones', icon: <ClipboardList className="h-4 w-4" /> },
      { href: '/erp/finanzas/cuentas-cobro', label: 'Cuentas de cobro', icon: <Receipt className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Catálogo y tienda',
    items: [
      { href: '/erp/catalogo', label: 'Catálogo', icon: <Package className="h-4 w-4" /> },
      { href: '/erp/catalogo/acabados', label: 'Acabados', icon: <Palette className="h-4 w-4" /> },
      { href: '/erp/proveedores', label: 'Proveedores', icon: <Building2 className="h-4 w-4" /> },
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
