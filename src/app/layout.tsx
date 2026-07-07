/**
 * 🏛️ PORTAL: Root Layout (The Agnostic Shell)
 * ────────────────────────────────────────────
 * AXIOMATIC_CONTRACT:
 * - MUST: Inyectar tokens CSS de satélite inline para prevenir FOUC.
 * - NEVER: Contener lógica de negocio o de transformación de DNA.
 *
 * ADR: Se opta por inyección inline de estilos de satélite para garantizar
 * que la identidad visual sea soberana desde el primer frame de renderizado.
 *
 * RELATIONSHIPS:
 * - Padre de todas las rutas del sistema.
 */
import type { Metadata } from "next";
import {
  Candal,
  Capriola,
  Comfortaa,
  Outfit,
  Inter,
} from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { AdminTools } from "@/components/agnostic/admin/AdminTools";
import { getVaultData } from "@/core/server/vault";
import { getProjectStorageRoot } from "@/server/activeProject";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";
import { SYSTEM_NS } from "@/lib/agnostic/constants";
import { buildOrganizationSchema, readCommercialConfig, serializeJsonLd } from "@/lib/veta/seo/schemaGenerator";
import { sessionOptions, type SessionData } from "@/lib/agnostic/session";

export const metadata: Metadata = {
  title: "Agnostic System",
  description: "A professional, storage-based agnostic framework",
};

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-comfortaa",
  display: "swap",
});

const capriola = Capriola({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-capriola",
  display: "swap",
});

const candal = Candal({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-candal",
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const storageRoot = getProjectStorageRoot();
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const vaultData = await getVaultData([
    SYSTEM_NS.ROUTES,
    SYSTEM_NS.SCHEMAS,
    SYSTEM_NS.CONFIG,
    SYSTEM_NS.TOKENS,
    "configuracion_comercial",
  ]);

  let tokenStyles = "";
  try {
    const tokensPath = path.join(storageRoot, "styles", "tokens.css");
    tokenStyles = await fs.readFile(tokensPath, "utf-8");
  } catch {
    // The satellite still has no tokens and falls back to the Seed defaults.
  }

  let dna: Record<string, unknown> = {};
  try {
    const manifestPath = path.join(storageRoot, "manifest.json");
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    dna = JSON.parse(manifestContent.replace(/^\uFEFF/, ""));
  } catch {
    // No manifest yet, keep the default local strategy.
  }

  const sysConfig = (vaultData?.["system_config"]?.[0]?.data ?? {}) as Record<string, unknown>;
  const appName = (sysConfig["app_name"] as string | undefined) ?? "Agnostic System";
  const commercialConfig = readCommercialConfig(vaultData["configuracion_comercial"] as any);
  const organizationSchema = buildOrganizationSchema(commercialConfig);

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={[
        outfit.variable,
        inter.variable,
        comfortaa.variable,
        capriola.variable,
        candal.variable,
      ].join(" ")}
    >
      <head>
        {tokenStyles && (
          <style
            id="agnostic-tokens"
            dangerouslySetInnerHTML={{ __html: tokenStyles }}
          />
        )}

        <link
          rel="stylesheet"
          href="/api/satellite-styles"
          precedence="satellite"
        />

        <script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
        />

        <title>{appName}</title>
      </head>
      <body className="antialiased">
        <AppProvider initialData={vaultData}>
          <AuthProvider initialUser={session.user ?? null}>
            {children}
            <AdminTools />
            <Toaster position="bottom-left" expand={false} richColors />
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}
