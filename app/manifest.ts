import type { MetadataRoute } from 'next'

// PWA Web App Manifest (checklist SEO 2026-08-16, #11). Colores tomados de los tokens del
// Diamante 4 (app/globals.css): espresso-700 #3E2A21 (fondo oscuro), gold-500 #8B6F3C,
// bg-paper #FCFBF9. Ícono = /icon.svg (favicon existente).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Veta Dorada — Carpintería arquitectónica en Bogotá',
    short_name: 'Veta Dorada',
    description:
      'Estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera a la medida.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FCFBF9',
    theme_color: '#3E2A21',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}