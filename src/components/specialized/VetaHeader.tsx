'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppState } from '@/context/AppContext'
import { Menu, X, Compass, Layers, Calendar } from 'lucide-react'

export default function VetaHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data } = useAppState()

  const configRecords = data['configuracion_comercial'] || []

  // Helper helper to get settings from db
  const getConfigVal = (key: string, fallback: string) => {
    const record = configRecords.find((r: any) => r.data?.llave === key)
    return record?.data?.valor || fallback
  }

  const logoNegativo = getConfigVal('logo_negativo_url', '/api/assets/logo_veta_dorada_negative.svg')
  const brandLabel = getConfigVal('brand_label_alternative', 'VETA DORADA')

  const links = [
    { label: 'Espacios a Medida', path: '/espacios-a-medida', icon: Compass },
    { label: 'Colecciones', path: '/colecciones', icon: Layers },
    { label: 'Agendar', path: '/agendar', icon: Calendar },
  ]

  return (
    <header className="sticky top-0 z-50 w-full veta-glass-navbar transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand/Logo - loaded dynamically from configuracion_comercial */}
        <Link href="/" className="flex items-center space-x-2.5 group select-none">
          {logoNegativo ? (
            <img 
              src={logoNegativo} 
              alt={brandLabel} 
              className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]" 
            />
          ) : (
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold tracking-[0.2em] text-[#F5F5F5] group-hover:text-[#D4C5A1] transition-colors duration-300 font-outfit uppercase">
                {brandLabel}
              </span>
              <span className="text-[9px] uppercase tracking-[0.4em] text-[#8E8A80] font-sans -mt-0.5 pl-0.5">
                estudio de diseño
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-10">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.path
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center space-x-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 relative py-2 ${
                  isActive 
                    ? 'text-[#D4C5A1]' 
                    : 'text-[#8E8A80] hover:text-[#F5F5F5]'
                }`}
              >
                <Icon className="w-4 h-4 opacity-75" />
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#D4C5A1] rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Call to Action Desktop */}
        <div className="hidden md:flex items-center">
          <Link
            href="/agendar"
            className="veta-btn-gold px-6 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all duration-300"
          >
            Agendar Asesoría
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#8E8A80] hover:text-[#F5F5F5] transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-[#0A0A0A] border-b border-[#D4C5A1]/10 px-6 py-8 flex flex-col space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-4">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.path
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-lg text-sm font-medium uppercase tracking-wider transition-colors ${
                    isActive 
                      ? 'bg-[#D4C5A1]/10 text-[#D4C5A1]' 
                      : 'text-[#8E8A80] hover:text-[#F5F5F5] hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="pt-4 border-t border-[#D4C5A1]/10">
            <Link
              href="/agendar"
              onClick={() => setMobileMenuOpen(false)}
              className="veta-btn-gold block w-full text-center py-3 rounded-sm text-xs font-semibold uppercase tracking-wider"
            >
              Agendar Asesoría
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
