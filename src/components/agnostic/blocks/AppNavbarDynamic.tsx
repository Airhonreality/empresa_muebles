'use client'
import { useAuth } from '@/context/AuthContext'
import { AgnosticNavbar } from './AgnosticNavbar'

const NAV_BY_ROLE: Record<string, string> = {
  admin:      'nav_admin',
  produccion: 'nav_produccion',
  comercial:  'nav_comercial',
  cliente:    'nav_cliente',
}

export function AppNavbarDynamic() {
  const { user } = useAuth()
  const navId = (user?.role && NAV_BY_ROLE[user.role]) ?? 'nav_erp_main'
  return <AgnosticNavbar nav_id={navId} />
}
