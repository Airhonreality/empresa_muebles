import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono, Teachers } from "next/font/google";
import "./globals.css";
// Import directo de DataStoreProvider.tsx (no del barrel lib/data/index.ts): index.ts también
// define useDataStore() (usa useSyncExternalStore, hook de cliente), y Next marca este Server
// Component entero como "necesita 'use client'" si lo importa transitivamente. Mismo patrón que
// getDataStore() en lib/auth/session.ts — ver comentario en lib/data/store.ts.
import { DataStoreProvider } from "@/lib/data/DataStoreProvider";
import type { StoreSnapshot } from "@/lib/data/snapshot";

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

// Duración máxima de función para longPollVersionAction (lib/data/actions/longpoll.ts, t-132):
// una función 'use server' no puede exportar valores no-función, así que el límite de duración
// se declara acá (route segment config del layout raíz que envuelve a DataStoreProvider).
// Verificar contra el límite real del plan de Vercel configurado en el dashboard antes de subir.
export const maxDuration = 25;

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Hidratación inicial sin loading flicker (§3.1d, plan_f10_migracion.md): con
  // DATA_IMPL=drizzle, el snapshot se trae acá server-side (Server Component) y se pasa
  // ya listo al Provider cliente — el primer HTML ya viene con los datos reales.
  const impl = process.env.DATA_IMPL ?? 'mock'
  let initialSnapshot: StoreSnapshot | undefined
  if (impl === 'drizzle') {
    const { fetchSnapshotAction } = await import('@/lib/data/actions/hydrate')
    initialSnapshot = await fetchSnapshotAction()
  }

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
        <DataStoreProvider mode={impl === 'drizzle' ? 'drizzle' : 'mock'} initialSnapshot={initialSnapshot}>
          {children}
        </DataStoreProvider>
      </body>
    </html>
  );
}