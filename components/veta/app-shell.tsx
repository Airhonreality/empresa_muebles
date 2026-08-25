'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock, LayoutGrid, Images, UserCircle, Home } from 'lucide-react';
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
  { href: '/cuenta', label: 'Mi cuenta', icon: UserCircle },
] as const;

export function AppShell({ children, precio3dFormatted }: { children: React.ReactNode, precio3dFormatted: string }) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-100">
      <header className="border-b border-border-subtle bg-bg-raised/80 backdrop-blur-sm sticky top-0 z-nav shadow-[var(--shadow-nav-elevated)]">
        <div className="mx-auto max-w-7xl px-8 sm:px-12 lg:px-16">
          <div className="flex h-16 items-center justify-between">
            
            {/* 1. Izquierda: Logo */}
            <div className="flex flex-1 items-center justify-start">
              <Link href="/" className="flex items-center gap-2.5" aria-label="Veta Dorada - Inicio">
                <Image src="/logo-veta-positive.svg" alt="Ícono Veta Dorada" width={32} height={40} priority className="h-8 w-auto" />
                <span className="text-xl tracking-tight hidden sm:block">
                  <strong className="font-bold text-text-heading">Veta</strong>{' '}
                  <span className="font-medium text-gold-600">Dorada</span>
                </span>
              </Link>
            </div>

            {/* 2. Centro: Enlaces de Navegación (Centrados) */}
            <nav className="hidden md:flex flex-[2] items-center justify-center gap-8" aria-label="Navegación principal">
              {navigation.filter(item => item.href !== '/cuenta').map((item) => (
                item.href === '/espacios' ? (
                  <div className="relative group" key={item.href}>
                    <NavItem {...item} />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
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
                ) : (
                  <NavItem key={item.href} {...item} />
                )
              ))}
            </nav>

            {/* 3. Derecha: Acciones (Botón y Login) */}
            <div className="hidden md:flex flex-1 items-center justify-end gap-5">
              <AsesoriaBoton
                precio3dFormatted={precio3dFormatted}
                className="hidden lg:flex px-4 py-1.5 border border-gold-500/40 text-gold-700 hover:border-gold-600 hover:bg-gold-50 text-sm font-medium rounded-sm transition-all duration-500"
              >
                Agenda tu asesoría
              </AsesoriaBoton>
              <div className="h-3 w-px bg-border-strong/40 hidden lg:block" aria-hidden="true" />
              <Link
                href="/cuenta"
                className="text-text-muted hover:text-gold-700 transition-colors duration-300"
                aria-label="Mi cuenta"
                title="Mi cuenta"
              >
                <UserCircle size={18} strokeWidth={1.25} />
              </Link>
            </div>

            {/* Botón menú móvil */}
            <div className="md:hidden flex justify-end">
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

      {/* Footer Editorial Sello de Taller & Revista de Arquitectura */}
      <footer className="border-t border-border-subtle bg-bg-paper text-text-primary">
        {/* Banner Superior Editorial - Marca & Manifiesto */}
        <div className="border-b border-border-subtle bg-bg-alt/50 py-8">
          <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo-veta-positive.svg" alt="Ícono Veta Dorada" width={28} height={36} className="h-7 w-auto" />
              <div>
                <span className="text-xl tracking-tight font-display">
                  <strong className="font-bold text-text-heading">Veta</strong>{' '}
                  <span className="font-medium text-gold-600 font-serif italic">Dorada</span>
                </span>
                <p className="text-xs text-text-muted font-light mt-0.5">
                  Carpintería Arquitectónica & Ebanistería a la Medida
                </p>
              </div>
            </div>
            <p className="text-xs md:text-sm font-serif italic text-gold-700 md:text-right max-w-md">
              “Tres generaciones de oficio en Bogotá transformando madera noble en arquitectura de bienestar.”
            </p>
          </div>
        </div>

        {/* Retícula de Navegación Estilo Colofón */}
        <div className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Columna 1: Estudio & Redes */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-widest text-gold-600 mb-3">Estudio & Taller</p>
              <p className="text-xs text-text-muted leading-relaxed font-light">
                Diseño integral, manufactura en taller propio e instalación experta para residencias de alto nivel y desarrollos corporativos.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <p className="text-[11px] font-mono uppercase text-text-muted mb-2">Síguenos en Redes</p>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/veta_dorada/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Veta Dorada en Instagram"
                  className="text-text-muted transition-colors duration-fast hover:text-gold-600 flex items-center gap-1.5 text-xs"
                >
                  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.tiktok.com/@veta_dorada.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Veta Dorada en TikTok"
                  className="text-text-muted transition-colors duration-fast hover:text-gold-600 flex items-center gap-1.5 text-xs"
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden fill="currentColor">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                  <span>TikTok</span>
                </a>
              </div>
            </div>
          </div>

          {/* Columna 2: Categorías de Espacios */}
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-gold-600 mb-3">Colección de Espacios</p>
            <nav className="flex flex-col gap-2" aria-label="Categorías de espacios">
              {categoriasEspacios.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="text-xs text-text-muted hover:text-text-heading hover:translate-x-0.5 transition-all duration-fast font-light"
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Columna 3: Canal B2B & Servicios Profesional */}
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-gold-600 mb-3">Servicios & Alianzas</p>
            <nav className="flex flex-col gap-3" aria-label="Servicios y canal B2B">
              {/* Enlace B2B Profesional con Sello Editorial (Sin botón tosco) */}
              <Link
                href="/para-arquitectos"
                className="group flex items-center justify-between py-1.5 border-b border-gold-500/30 text-xs font-medium text-text-heading hover:text-gold-600 transition-colors"
              >
                <span className="font-serif italic text-gold-600 group-hover:text-gold-700">Para Arquitectos & B2B</span>
                <span className="text-gold-500 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/como-trabajamos"
                className="text-xs text-text-muted hover:text-text-heading hover:translate-x-0.5 transition-all duration-fast font-light"
              >
                Nuestro Proceso
              </Link>
              <Link
                href="/testimonios"
                className="text-xs text-text-muted hover:text-text-heading hover:translate-x-0.5 transition-all duration-fast font-light"
              >
                Testimonios de Clientes
              </Link>
              <Link
                href="/portafolio"
                className="text-xs text-text-muted hover:text-text-heading hover:translate-x-0.5 transition-all duration-fast font-light"
              >
                Explorar Portafolio
              </Link>
            </nav>
          </div>

          {/* Columna 4: Atención & Datos Legales */}
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-gold-600 mb-3">Contacto & Legal</p>
            <div className="flex flex-col gap-2.5">
              <MetaItem icon={MapPin}>Cra. 72a #71A 57, Bogotá</MetaItem>
              <MetaItem icon={Phone}>+57 302 5922101</MetaItem>
              <MetaItem icon={Clock}>Lun–Sáb 08:00–18:00</MetaItem>
            </div>
            <p className="mt-4 text-[11px] text-text-muted leading-relaxed border-t border-border-subtle pt-3 font-light">
              Veta Dorada® es marca comercial registrada. Operación y facturación por HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9.
            </p>
          </div>
        </div>

        {/* Sub-footer Colofón */}
        <div className="border-t border-border-subtle bg-bg-alt/30">
          <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-2 font-mono text-[11px]">
            <span>© 2024–2026 Veta Dorada SAS. Todos los derechos reservados.</span>
            <span className="text-gold-600 font-serif italic">Oficio & Arquitectura de Madera</span>
          </div>
        </div>
      </footer>

      <WhatsappFloat />
    </div>
  );
}