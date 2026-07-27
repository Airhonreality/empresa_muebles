'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as Icons from 'lucide-react'
import {
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ApplicationShellProps } from '@agnostic/core'
import { useAuth } from '@/context/AuthContext'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { canAccess, resolveCapabilities } from './erp-navigation-policy'

interface NavigationItem {
  label: string
  path?: string
  icon?: string
  capability?: string
  disabled?: boolean
  children?: NavigationItem[]
}

interface NavigationConfig {
  name?: string
  brand?: { label?: string; path?: string }
  links?: NavigationItem[]
}

function iconFor(name?: string) {
  if (!name || !(name in Icons)) return Icons.Circle
  return (Icons as unknown as Record<string, typeof Icons.Circle>)[name]
}

function isItemActive(pathname: string, item: NavigationItem): boolean {
  if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) return true
  return item.children?.some((child) => isItemActive(pathname, child)) ?? false
}

function filterItems(items: NavigationItem[], capabilities: Set<string>): NavigationItem[] {
  return items.flatMap((item) => {
    if (!canAccess(capabilities, item.capability)) return []
    const children = item.children ? filterItems(item.children, capabilities) : undefined
    if (!item.path && item.children && !children?.length) return []
    return [{ ...item, children }]
  })
}

function NavigationLink({
  item,
  pathname,
  compact = false,
  onNavigate,
}: {
  item: NavigationItem
  pathname: string
  compact?: boolean
  onNavigate?: () => void
}) {
  const Icon = iconFor(item.icon)
  const active = isItemActive(pathname, item)

  if (item.children?.length) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'h-11 justify-start gap-3 rounded-lg px-3 text-sm font-medium',
              compact && 'w-11 justify-center px-0',
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label={compact ? item.label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!compact && <span className="truncate">{item.label}</span>}
            {!compact && <ChevronDown className="ml-auto h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
          <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.children.map((child) => {
            const ChildIcon = iconFor(child.icon)
            return child.disabled || !child.path ? (
              <DropdownMenuItem key={child.label} disabled className="min-h-11 gap-3">
                <ChildIcon className="h-4 w-4" />
                <span>{child.label}</span>
                <span className="ml-auto text-[10px] uppercase">Pendiente</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={child.path} asChild className="min-h-11 gap-3">
                <Link href={child.path} onClick={onNavigate}>
                  <ChildIcon className="h-4 w-4" />
                  {child.label}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (!item.path || item.disabled) return null
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'h-11 justify-start gap-3 rounded-lg px-3 text-sm font-medium',
        compact && 'w-11 justify-center px-0',
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Link
        href={item.path}
        onClick={onNavigate}
        aria-label={compact ? item.label : undefined}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!compact && <span className="truncate">{item.label}</span>}
      </Link>
    </Button>
  )
}

function NavigationList({
  items,
  pathname,
  compact,
  onNavigate,
}: {
  items: NavigationItem[]
  pathname: string
  compact?: boolean
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1">
      {items.map((item) => (
        <NavigationLink
          key={item.path ?? item.label}
          item={item}
          pathname={pathname}
          compact={compact}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  )
}

export default function ErpApplicationShell({ children }: ApplicationShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { data: navbarRecords, isLoading } = useRelationData('app_navbars')
  const [compact, setCompact] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigation = useMemo<NavigationConfig | null>(() => {
    const record = navbarRecords.find((item) => item.data?.name === 'nav_erp_main')
    return (record?.data as NavigationConfig | undefined) ?? null
  }, [navbarRecords])

  const capabilities = useMemo(
    () => resolveCapabilities(auth?.user?.role, auth?.user?.metadata?.type),
    [auth?.user?.metadata?.type, auth?.user?.role],
  )
  const items = useMemo(
    () => filterItems(navigation?.links ?? [], capabilities),
    [capabilities, navigation?.links],
  )

  const logout = async () => {
    await auth?.logout()
    router.replace('/login')
  }

  const brand = navigation?.brand?.label || 'ERP'
  const brandPath = navigation?.brand?.path || '/app'

  return (
    <div className="min-h-screen bg-muted/20">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r bg-background/95 backdrop-blur lg:flex lg:flex-col',
          compact ? 'w-[76px]' : 'w-64',
        )}
      >
        <div className={cn('flex h-16 items-center border-b px-4', compact ? 'justify-center' : 'justify-between')}>
          <Link href={brandPath} className="min-w-0 font-semibold tracking-tight">
            {compact ? brand.slice(0, 2).toUpperCase() : brand}
          </Link>
          {!compact && (
            <Button variant="ghost" size="icon" onClick={() => setCompact(true)} aria-label="Contraer navegación">
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="space-y-2" aria-label="Cargando navegación">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <NavigationList items={items} pathname={pathname} compact={compact} />
          )}
        </div>
        <div className="border-t p-3">
          {compact ? (
            <Button variant="ghost" size="icon" onClick={() => setCompact(false)} aria-label="Expandir navegación">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          ) : (
            <p className="px-3 text-xs text-muted-foreground">Operación integrada por proyecto</p>
          )}
        </div>
      </aside>

      <div className={cn('min-h-screen transition-[padding] lg:pl-64', compact && 'lg:pl-[76px]')}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir navegación">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="h-16 justify-center border-b px-5 text-left">
                <SheetTitle>{brand}</SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <NavigationList
                  items={items}
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {items.find((item) => isItemActive(pathname, item))?.label ?? 'Inicio'}
            </p>
            <p className="truncate text-xs text-muted-foreground">Veta Dorada ERP</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-11 gap-2 px-2" aria-label="Abrir menú de cuenta">
                <CircleUserRound className="h-5 w-5" />
                <span className="hidden max-w-40 truncate text-sm sm:inline">
                  {auth?.user?.name || auth?.user?.email || 'Mi cuenta'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block truncate">{auth?.user?.name || 'Mi cuenta'}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {auth?.user?.role || 'Sin rol asignado'}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canAccess(capabilities, 'profile:view') && (
                <DropdownMenuItem asChild className="min-h-11">
                  <Link href="/app/erp/perfil">Perfil</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={logout} className="min-h-11 gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="p-3 sm:p-5 lg:p-6">{children}</div>
      </div>
    </div>
  )
}
