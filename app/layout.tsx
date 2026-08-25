import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Inter, IBM_Plex_Mono, Teachers } from "next/font/google";
import { AttributionTracker } from "@/components/analytics/AttributionTracker";
import { ClarityAnalytics } from "@/components/analytics/ClarityAnalytics";
import { GoogleTagAnalytics } from "@/components/analytics/GoogleTagAnalytics";
import "./globals.css";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://vetadeoro.co"),
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
        <GoogleTagAnalytics />
        <Suspense fallback={null}>
          <AttributionTracker />
        </Suspense>
        <ClarityAnalytics />
        {children}
      </body>
    </html>
  );
}