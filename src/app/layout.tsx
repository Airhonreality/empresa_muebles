/**
 * Root layout for the Agnostic Shell.
 */
import type { Metadata } from "next";
import { Candal, Capriola, Comfortaa, Outfit, Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import { getIronSession } from "iron-session";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { AdminTools } from "@/components/agnostic/admin/AdminTools";
import { getVaultData } from "@/core/server/vault";
import { getProjectStorageRoot } from "@/server/activeProject";
import fs from "fs/promises";
import path from "path";
import { SYSTEM_NS } from "@/lib/agnostic/constants";
import { buildOrganizationSchema, readCommercialConfig, serializeJsonLd } from "@/lib/veta/seo/schemaGenerator";
import { sessionOptions, type SessionData } from "@/lib/agnostic/session";
import { getPublicHomeContent } from '@/server/public-site-data';

export const metadata: Metadata = {
  title: "Agnostic System",
  description: "A professional, storage-based agnostic framework",
};

const outfit = Outfit({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-outfit", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });
const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-comfortaa", display: "swap" });
const capriola = Capriola({ subsets: ["latin"], weight: "400", variable: "--font-capriola", display: "swap" });
const candal = Candal({ subsets: ["latin"], weight: "400", variable: "--font-candal", display: "swap" });

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isPublicSite = (await headers()).get('x-agnostic-public-site') === '1';
  const storageRoot = getProjectStorageRoot();
  const session = isPublicSite ? null : await getIronSession<SessionData>(await cookies(), sessionOptions);
  const vaultData = isPublicSite
    ? { configuracion_comercial: (await getPublicHomeContent()).commercial_config }
    : await getVaultData([
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
    // Use seed defaults when the fork has no tokens yet.
  }

  let dna: Record<string, unknown> = {};
  try {
    const manifestPath = path.join(storageRoot, "manifest.json");
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    dna = JSON.parse(manifestContent.replace(/^\uFEFF/, ""));
  } catch {
    // Keep the local strategy fallback.
  }

  const sysConfig = (vaultData?.["system_config"]?.[0]?.data ?? {}) as Record<string, unknown>;
  const appName = (sysConfig["app_name"] as string | undefined) ?? "Agnostic System";
  const commercialConfig = readCommercialConfig(vaultData["configuracion_comercial"] as any);
  const organizationSchema = buildOrganizationSchema(commercialConfig);
  void dna;

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={[outfit.variable, inter.variable, comfortaa.variable, capriola.variable, candal.variable].join(" ")}
    >
      <head>
        {tokenStyles && (
          <style id="agnostic-tokens" dangerouslySetInnerHTML={{ __html: tokenStyles }} />
        )}
        <link rel="stylesheet" href="/api/satellite-styles" precedence="satellite" />
        <script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
        />
        <title>{appName}</title>
      </head>
      <body className="antialiased">
        <AppProvider initialData={vaultData}>
          {isPublicSite ? children : (
            <AuthProvider initialUser={session?.user ?? null}>
              {children}
              <AdminTools />
              <Toaster position="bottom-left" expand={false} richColors />
            </AuthProvider>
          )}
        </AppProvider>
      </body>
    </html>
  );
}

