'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock, LayoutGrid, Images, NotebookPen, UserCircle, Home, Users, Briefcase } from 'lucide-react';
import { NavItem } from '@/components/veta/nav-item';
import { MetaItem } from '@/components/veta/meta-item';
import { WhatsappFloat } from '@/components/veta/whatsapp-float';
import { AsesoriaBoton } from '@/components/veta/asesoria-boton';

// Slugs F-09/F-14 tal cual contenido_F09_landings.md / disenio_F14_pisos_madera.md
// (corregidos 2026-08-17: 4 de 7 no coincidían con las rutas reales, causaban 404).
const categoriasEspacios = [
  { href: '/espacios/cocinas-integrales-bogota', label: 'Cocinas Integrales' },
  { href: '/espacios/closets-vestidores-bogota', label: 'Closets y Vestidores' },
  { href: '/espacios/centros-de-entretenimiento', label: 'Centros de Entretenimiento' },
  { href: '/espacios/estudios-home-office', label: 'Estudios y Home Office' },
  { href: '/espacios/cavas-y-bares', label: 'Cavas y Bares' },
  { href: '/espacios/consolas-recibidores', label: 'Consolas y Recibidores' },
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

const footerEnlaces = [
  ...navigation.map(({ href, label }) => ({ href, label })),
  { href: '/como-trabajamos', label: 'Proceso' },
  { href: '/conocenos', label: 'Conócenos' },
  { href: '/testimonios', label: 'Testimonios' },
  { href: '/para-arquitectos', label: 'Para Arquitectos B2B' },
];

export function AppShell({ children, precio3dFormatted }: { children: React.ReactNode, precio3dFormatted: string }) {
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
                    <AsesoriaBoton
                      precio3dFormatted={precio3dFormatted}
                      className="hidden lg:flex px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium rounded-sm transition-colors shadow-sm"
                    >
                      Agenda tu asesoría
                    </AsesoriaBoton>
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
            {/* Redes sociales (2026-08-16, links reales de Javier). Solo Instagram/TikTok
                visibles acá -- Facebook está inactivo, se omite del ícono clickeable a propósito
                (decisión de Javier) aunque sí entra en el sameAs del JSON-LD (lib/seo/jsonld.ts)
                para identidad de entidad. Íconos oficiales sin recolorear la marca, mismo
                criterio que WhatsappFloat. */}
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.instagram.com/veta_dorada/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Veta Dorada en Instagram"
                className="text-text-muted transition-colors duration-fast hover:text-gold-600"
              >
                <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@veta_dorada.co"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Veta Dorada en TikTok"
                className="text-text-muted transition-colors duration-fast hover:text-gold-600"
              >
                <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden fill="currentColor">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>
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