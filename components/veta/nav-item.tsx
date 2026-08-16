'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Reemplaza el patrón anterior (LinkButton con label+desc, look de pill/botón de 44px --
// feedback de Javier 2026-08-15: "muy regordetes, doble texto"). El nav editorial de referencia
// (diseno_web_publica_diamante.md §7) pide texto + ícono, subrayado dorado en hover/activo, sin
// fondo -- no un botón. Sigue siendo un solo <a> (Link), nunca <button> anidado (D-02/D-03).
export function NavItem({ href, label, icon: Icon }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`inline-flex items-center gap-2 rounded-sm border-b-2 px-1 py-2 text-sm font-medium outline-none [transition:color_var(--transition-nav-smooth),border-color_var(--transition-nav-smooth)] focus-visible:shadow-[var(--shadow-ring-focus)] ${
        isActive
          ? 'border-brand text-brand'
          : 'border-transparent text-text-muted hover:border-brand/40 hover:text-text-primary'
      }`}
    >
      <Icon aria-hidden size={16} strokeWidth={1.75} className="shrink-0" />
      {label}
    </Link>
  );
}
