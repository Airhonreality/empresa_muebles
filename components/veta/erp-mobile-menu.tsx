'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { LinkButton, Button } from '@/components/veta/button'
import { logoutEmpleadoAction } from '@/lib/auth/actions'
import { ERP_NAV_SECTIONS } from '@/components/veta/erp-nav'

export function ErpMobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modal bg-overlay-backdrop" />
        <Dialog.Content
          className="fixed inset-0 z-[100] flex flex-col bg-bg-raised border-l border-border-subtle shadow-lg"
          style={{ width: '100%', maxWidth: 320 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-raised">
            <Dialog.Title className="font-display text-lg font-semibold text-text-heading">
              Menú ERP
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="icon" size="md" aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 thin-scrollbar" aria-label="Navegación ERP">
            {ERP_NAV_SECTIONS.map((section) => (
              <div key={section.title ?? section.items[0]?.href} className="mb-4">
                {section.title && (
                  <h3 className="mb-2 px-2 text-[10px] font-bold uppercase text-text-muted tracking-widest">
                    {section.title}
                  </h3>
                )}
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const isActive = isItemActive(item.href)
                    return (
                      <LinkButton
                        key={item.href}
                        href={item.href}
                        variant={isActive ? 'primary' : 'ghost'}
                        size="md"
                        className={`w-full justify-start gap-2 h-9 px-3 text-sm ${isActive ? 'text-text-heading' : ''}`}
                        onClick={onClose}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </LinkButton>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-border-subtle bg-bg-raised p-3">
            <form action={logoutEmpleadoAction} className="mt-2">
              <Button type="submit" variant="ghost" size="md" className="w-full text-sm">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
