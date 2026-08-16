import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono, Teachers } from "next/font/google";
import "./globals.css";
// Fix de arquitectura (auditoría 2026-08-15, arnes/lineas/demanda/auditoria_prelanzamiento_seo_20260815.md):
// este layout envuelve TODO el árbol de rutas, público y /erp. Antes hidrataba acá el snapshot
// COMPLETO del ERP (fetchSnapshotAction(), sin proyección de columnas) y lo pasaba como prop a
// <DataStoreProvider>, un Client Component — en RSC eso se serializa en el HTML/payload que
// recibe CUALQUIER visitante de CUALQUIER página pública. La hidratación completa se movió a
// app/erp/layout.tsx (ya gateado por middleware.ts, solo empleados con sesión válida). Las
// páginas públicas que necesitan datos reales los traen por Server Action escopada
// (lib/data/actions/public.ts, lib/data/actions/portafolio.ts), no de este layout.

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const teachers = Teachers({
  variable: "--font-teachers",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Veta Dorada — Carpintería arquitectónica en Bogotá",
  description:
    "Estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera a la medida. Tres generaciones de oficio.",
};

export function viewport() {
  return {
    viewTransition: true,
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} ${teachers.variable} h-full antialiased`}
    >
      <head>
        <style>{`
          ::view-transition-old(root),
          ::view-transition-new(root) {
            animation-duration: 200ms;
            animation-timing-function: var(--ease-out);
          }
          ::view-transition-old(root) {
            animation-name: fade-out;
          }
          ::view-transition-new(root) {
            animation-name: fade-in;
          }
          @keyframes fade-in { from { opacity: 0; } }
          @keyframes fade-out { to { opacity: 0; } }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}