'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  // Icon se mantiene en la interfaz para no romper app-shell, pero no se renderiza.
  icon?: unknown;
}

export function NavItem({ href, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative inline-flex items-center px-1 py-1 text-sm outline-none transition-colors duration-300 ${
        isActive
          ? 'font-medium text-text-heading'
          : 'font-light text-text-muted hover:text-text-heading'
      }`}
    >
      {label}
      {/* Elegante subrayado invisible que aparece en hover/active (hairline) */}
      <span 
        className={`absolute -bottom-1 left-0 h-[1px] bg-gold-500 transition-all duration-500 ${
          isActive ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
      />
    </Link>
  );
}
