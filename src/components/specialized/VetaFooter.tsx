'use client'
import React from 'react'
import Link from 'next/link'
import { useAppState } from '@/context/AppContext'
import { Instagram, MessageCircle, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react'

export default function VetaFooter() {
  const { data } = useAppState()
  const configRecords = data['configuracion_comercial'] || []

  // Helper helper to get settings from db
  const getConfigVal = (key: string, fallback: string) => {
    const record = configRecords.find((r: any) => r.data?.llave === key)
    return record?.data?.valor || fallback
  }

  const logoNegativo = getConfigVal('logo_negativo_url', '/api/assets/logo_veta_dorada_negative.svg')
  const brandLabel = getConfigVal('brand_label_alternative', 'VETA DORADA')
  
  const whatsappNum = getConfigVal('whatsapp_number', '+57 300 123 4567')
  const whatsappLink = getConfigVal('whatsapp_link', 'https://wa.me/573001234567')
  const instagramUrl = getConfigVal('instagram_url', 'https://instagram.com/vetadorada')
  const tiktokUrl = getConfigVal('tiktok_url', 'https://tiktok.com/@vetadorada')
  
  const nitLegal = getConfigVal('nit_legal', '901421357')
  const nombreEmpresa = getConfigVal('nombre_empresa', 'Hermanos García González SAS')

  return (
    <footer className="bg-[#0A0A0A] border-t border-[#D4C5A1]/10 text-[#8E8A80] pt-16 pb-12 font-sans relative overflow-hidden">
      {/* Decorative subtle ambient light */}
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#D4C5A1]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-5">
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
          <p className="text-sm max-w-sm leading-relaxed text-[#8E8A80]">
            Diseño artesanal y modelado de alta gama para espacios integrales. Creamos obras de arte habitables y colecciones exclusivas de mobiliario con acabados de ultra-lujo.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <a 
              href={instagramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-[#D4C5A1]/10 hover:border-[#D4C5A1]/40 hover:text-[#F5F5F5] transition-all duration-300"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            {tiktokUrl && (
              <a 
                href={tiktokUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full border border-[#D4C5A1]/10 hover:border-[#D4C5A1]/40 hover:text-[#F5F5F5] transition-all duration-300 flex items-center justify-center text-xs font-bold tracking-tighter"
                aria-label="TikTok"
              >
                <span>🎵</span>
              </a>
            )}
            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-[#D4C5A1]/10 hover:border-[#D4C5A1]/40 hover:text-[#F5F5F5] transition-all duration-300"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Navigation Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F5F5]">Navegación</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/espacios-a-medida" className="hover:text-[#D4C5A1] transition-colors duration-300">
                Espacios a Medida
              </Link>
            </li>
            <li>
              <Link href="/colecciones" className="hover:text-[#D4C5A1] transition-colors duration-300">
                Colecciones de Catálogo
              </Link>
            </li>
            <li>
              <Link href="/agendar" className="hover:text-[#D4C5A1] transition-colors duration-300 text-[#D4C5A1]/90 font-medium">
                Agendar Asesoría
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact/Studio Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F5F5]">El Estudio</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-[#D4C5A1] shrink-0 mt-0.5" />
              <span>Medellín, Colombia</span>
            </li>
            <li className="flex items-start space-x-3">
              <Phone className="w-4 h-4 text-[#D4C5A1] shrink-0 mt-0.5" />
              <span>{whatsappNum}</span>
            </li>
            <li className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-[#D4C5A1] shrink-0 mt-0.5" />
              <span>contacto@vetadorada.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Legal & Corporate separator footer */}
      <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-[#D4C5A1]/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col space-y-1.5 text-center md:text-left">
          <p className="text-xs text-[#8E8A80] tracking-wide">
            © {new Date().getFullYear()} VETA DORADA. Todos los derechos reservados.
          </p>
          <p className="text-[11px] text-[#8E8A80]/70 flex items-center justify-center md:justify-start gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4C5A1]/60" />
            Operado legalmente por: <strong className="text-[#8E8A80]">{nombreEmpresa}</strong> — NIT {nitLegal}
          </p>
        </div>

        <div className="flex items-center space-x-6 text-[11px] text-[#8E8A80]/60">
          <Link href="/terminos" className="hover:text-[#D4C5A1] transition-colors duration-300">
            Términos de Servicio
          </Link>
          <span className="w-1 h-1 bg-[#D4C5A1]/20 rounded-full" />
          <Link href="/privacidad" className="hover:text-[#D4C5A1] transition-colors duration-300">
            Políticas de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  )
}
