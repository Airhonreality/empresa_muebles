'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock, LayoutGrid, Images, NotebookPen, UserCircle, Home } from 'lucide-react';
import { NavItem } from '@/components/veta/nav-item';
import { MetaItem } from '@/components/veta/meta-item';
import { WhatsappFloat } from '@/components/veta/whatsapp-float';

const categoriasEspacios = [
  { href: '/espacios/cocinas-integrales', label: 'Cocinas Integrales' },
  { href: '/espacios/closets-y-vestidores', label: 'Closets y Vestidores' },
  { href: '/espacios/centros-de-entretenimiento', label: 'Centros de Entretenimiento' },
  { href: '/espacios/estudios-y-home-office', label: 'Estudios y Home Office' },
  { href: '/espacios/cavas-y-bares', label: 'Cavas y Bares' },
  { href: '/espacios/consolas-y-recibidores', label: 'Consolas y Recibidores' },
  { href: '/espacios/pisos-de-madera', label: 'Pisos de Madera' },
];

// Feedback Javier 2026-08-15: nav anterior (label + desc en texto) se veía "regordete" y con
// doble texto. Un ícono por ítem reemplaza el desc -- mismo criterio editorial de MetaItem (D-01):
// ícono + una sola palabra, nada de badges ni texto secundario apilado.
// Decisión actualizada 2026-08-15 (SEO/UX): "Espacios" usa desplegable.
const navigation = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/espacios', label: 'Espacios', icon: LayoutGrid },
  { href: '/portafolio', label: 'Portafolio', icon: Images },
  { href: '/bitacora', label: 'Bitácora', icon: NotebookPen },
  { href: '/cuenta', label: 'Mi cuenta', icon: UserCircle },
] as const;

// Footer §3.4 contenido_F00_shell.md (Col 3 — Enlaces): mismas rutas reales de arriba + Inicio,
// sin íconos (es una lista de texto, no el nav). No se agregan Espacios/Cómo Trabajamos/
// Conócenos/Para Arquitectos/Agenda tu Asesoría: esas páginas (F-10/F-11/F-18/F-19/F-12) no
// existen todavía -- mismo criterio que app/(publico)/page.tsx:15 ("ningún <Link> apunta a una
// ruta que no exista").
const footerEnlaces = [
  ...navigation.map(({ href, label }) => ({ href, label })),
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-100">
      <header className="border-b border-border-subtle bg-bg-raised/80 backdrop-blur-sm sticky top-0 z-nav shadow-[var(--shadow-nav-elevated)]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Veta Dorada - Inicio">
              <Image src="/logo-veta-positive.svg" alt="Ícono Veta Dorada" width={32} height={40} priority className="h-8 w-auto" />
              <span className="text-xl tracking-tight">
                <strong className="font-bold text-text-heading">Veta</strong>{' '}
                <span className="font-medium text-gold-600">Dorada</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
              {navigation.map((item) => (
                item.href === '/espacios' ? (
                  <div className="relative group" key={item.href}>
                    <NavItem {...item} />
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                      <div className="w-64 bg-bg-raised border border-border-subtle rounded-md shadow-[var(--shadow-nav-elevated)] p-2 flex flex-col gap-1">
                        {categoriasEspacios.map((cat) => (
                          <Link
                            key={cat.href}
                            href={cat.href}
                            className="px-3 py-2 text-sm text-text-muted hover:text-text-heading hover:bg-bg-alt rounded-sm transition-colors duration-fast"
                          >
                            {cat.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : item.href === '/cuenta' ? (
                  <div key={item.href} className="flex items-center gap-6 pl-2">
                    <div className="h-5 w-px bg-border-subtle" aria-hidden="true" />
                    <Link
                      href={item.href}
                      className="text-text-muted hover:text-text-heading transition-colors"
                      aria-label={item.label}
                      title={item.label}
                    >
                      <item.icon size={22} strokeWidth={1.5} />
                    </Link>
                  </div>
                ) : (
                  <NavItem key={item.href} {...item} />
                )
              ))}
            </nav>
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMenuMovilAbierto((v) => !v)}
                className="p-2 rounded-sm text-text-muted hover:text-text-primary"
                aria-label="Menú móvil"
                aria-expanded={menuMovilAbierto}
              >
                {menuMovilAbierto ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {menuMovilAbierto && (
            <nav className="md:hidden pb-4 flex flex-col gap-1" aria-label="Navegación principal (móvil)">
              {navigation.map((item) => (
                item.href === '/espacios' ? (
                  <div key={item.href} className="flex flex-col gap-1">
                    <Link
                      href={item.href}
                      onClick={() => setMenuMovilAbierto(false)}
                      className="rounded-sm px-3 py-2 text-sm font-medium text-text-heading hover:bg-bg-alt transition-colors duration-fast"
                    >
                      {item.label}
                    </Link>
                    <div className="pl-6 flex flex-col gap-1 border-l border-border-subtle ml-3">
                      {categoriasEspacios.map((cat) => (
                        <Link
                          key={cat.href}
                          href={cat.href}
                          onClick={() => setMenuMovilAbierto(false)}
                          className="rounded-sm px-3 py-2 text-sm text-text-muted hover:text-text-heading hover:bg-bg-alt transition-colors"
                        >
                          {cat.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-sm px-3 py-2 text-sm text-text-heading hover:bg-bg-alt transition-colors duration-fast"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1" id="main-content">
        {children}
      </main>

      {/* Footer editorial, §3.4 contenido_F00_shell.md -- NAP + enlaces + identidad legal,
          aprobado por el Supervisor 2026-08-09. Ver arnes/lineas/ola7/pantallas/disenio_F00_shell.md
          para qué quedó fuera de esta pasada (CTA "Agenda tu Asesoría" + modal transversal). */}
      <footer className="border-t border-border-subtle bg-bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <Image src="/logo-veta-positive.svg" alt="Ícono Veta Dorada" width={24} height={32} className="h-6 w-auto" />
              <span className="text-lg tracking-tight">
                <strong className="font-bold text-text-heading">Veta</strong>{' '}
                <span className="font-medium text-gold-600">Dorada</span>
              </span>
            </div>
            <p className="mt-1 text-sm text-text-primary">Diseña tu espacio. Habita el bienestar.</p>
            <p className="mt-3 text-sm text-text-muted">
              Estudio de diseño, manufactura e instalación de espacios integrales en madera. Tres
              generaciones de oficio en la construcción.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-heading">Contáctanos</p>
            <div className="mt-3 flex flex-col gap-2">
              <MetaItem icon={MapPin}>Cra. 72a #71A 57, Bogotá</MetaItem>
              <MetaItem icon={Phone}>+57 302 5922101</MetaItem>
              <MetaItem icon={Clock}>Lun–Sáb 08:00–18:00</MetaItem>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-heading">Enlaces</p>
            <nav className="mt-3 flex flex-col gap-2" aria-label="Enlaces del pie de página">
              {footerEnlaces.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-text-muted hover:text-text-primary transition-colors duration-fast"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-heading">Legal</p>
            <p className="mt-3 text-sm text-text-muted">
              Veta Dorada es una marca comercial registrada. Facturación, contratos, recaudos y
              garantías operados por HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9.
            </p>
          </div>
        </div>

        <div className="border-t border-border-subtle">
          <div className="mx-auto max-w-6xl px-6 py-4 text-center text-xs text-text-muted">
            © 2024–2026 Veta Dorada. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      <WhatsappFloat />
    </div>
  );
}