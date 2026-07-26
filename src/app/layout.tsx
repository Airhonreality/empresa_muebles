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
import { cookies, headers } from "next/headers";
import fs from "fs/promises";
import path from "path";
import { SYSTEM_NS } from "@/lib/agnostic/constants";
import { buildOrganizationSchema, readCommercialConfig, readSiteIdentity, serializeJsonLd } from "@/lib/seo/siteConfig";
import { readSiteInjections, HeadInjections, BodyEndInjections } from "@/lib/seo/siteInjections";
import { sessionOptions, type SessionData } from "@/lib/agnostic/session";

/**
 * Default site identity (browser tab, description, favicon) resolved from the
 * fork's `configuracion_comercial` data. Per-page titles override this via each
 * page's own generateMetadata. A commercial fork sets its identity in storage
 * and never edits this file.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await getVaultData(["configuracion_comercial"]);
    const identity = readSiteIdentity(readCommercialConfig(data["configuracion_comercial"] as unknown));
    const description = identity.description ?? "A professional, storage-based agnostic framework";
    const images = identity.ogImage ? [identity.ogImage] : undefined;
    return {
      metadataBase: identity.siteUrl ? new URL(identity.siteUrl) : undefined,
      title: { default: identity.title, template: `%s · ${identity.name}` },
      description,
      icons: identity.faviconUrl ? { icon: identity.faviconUrl } : undefined,
      openGraph: {
        type: "website",
        siteName: identity.name,
        title: identity.title,
        description,
        url: identity.siteUrl,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title: identity.title,
        description,
        site: identity.twitterHandle,
        images,
      },
    };
  } catch {
    return { title: "Agnostic System", description: "A professional, storage-based agnostic framework" };
  }
}

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
  const isPublicShare = (await headers()).get('x-agnostic-public-share') === '1';
  const storageRoot = getProjectStorageRoot();

  let session: Awaited<ReturnType<typeof getIronSession<SessionData>>> | null = null;
  if (!isPublicShare) {
    try {
      session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    } catch {
      // Missing/short SESSION_SECRET etc. → render unauthenticated instead of 500.
    }
  }

  // Public-share pages still need the site's public identity (SEO org schema,
  // analytics) — load only configuracion_comercial, never private namespaces.
  // Wrapped: a storage misconfig (e.g. bad AGNOSTIC_STORAGE_STRATEGY) must degrade
  // to empty data, never crash the whole app shell.
  let vaultData: Record<string, unknown> = {};
  try {
    vaultData = isPublicShare
      ? await getVaultData(["configuracion_comercial"])
      : await getVaultData([
          SYSTEM_NS.ROUTES, SYSTEM_NS.SCHEMAS, SYSTEM_NS.CONFIG, SYSTEM_NS.TOKENS, "configuracion_comercial",
        ]);
  } catch {
    // Storage unavailable/misconfigured → keep the shell alive with defaults.
  }

  let tokenStyles = "";
  try {
    const tokensPath = path.join(storageRoot, "styles", "tokens.css");
    tokenStyles = await fs.readFile(tokensPath, "utf-8");
  } catch {
    // The satellite still has no tokens and falls back to the Seed defaults.
  }

  // Fork-owned free-form CSS: @font-face for custom (non-Google) fonts, component
  // themes (.theme-*), and any override. Injected AFTER tokens.css so it wins by
  // cascade. Lets a commercial fork own all its CSS in storage/ without ever
  // editing globals.css (an engine file). Optional — absent on a virgin fork.
  let customStyles = "";
  try {
    const customPath = path.join(storageRoot, "styles", "custom.css");
    customStyles = await fs.readFile(customPath, "utf-8");
  } catch {
    // No custom fork CSS yet.
  }

  // Fork-owned marketing/SEO injections (pixels, GTM, verification meta, extra
  // JSON-LD, preconnects, chat widgets). Structured so scripts render as REAL
  // <script> elements (they execute; raw innerHTML would not) and meta is SSR'd.
  // Lets a fork add any tag WITHOUT editing this engine file. Absent → nothing.
  const injections = await readSiteInjections(storageRoot);

  let dna: Record<string, unknown> = {};
  try {
    const manifestPath = path.join(storageRoot, "manifest.json");
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    dna = JSON.parse(manifestContent.replace(/^\uFEFF/, ""));
  } catch {
    // No manifest yet, keep the default local strategy.
  }

  void dna;
  const commercialConfig = readCommercialConfig(vaultData["configuracion_comercial"] as unknown);
  const organizationSchema = buildOrganizationSchema(commercialConfig);
  const gaMeasurementId = readSiteIdentity(commercialConfig).gaMeasurementId;

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

        {customStyles && (
          <style
            id="agnostic-custom"
            dangerouslySetInnerHTML={{ __html: customStyles }}
          />
        )}

        <script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
        />

        {gaMeasurementId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
            <script
              id="google-analytics"
              dangerouslySetInnerHTML={{
                __html: [
                  "window.dataLayer = window.dataLayer || [];",
                  "function gtag(){window.dataLayer.push(arguments);}",
                  "gtag('js', new Date());",
                  `gtag('config', ${JSON.stringify(gaMeasurementId)}, { anonymize_ip: true });`,
                ].join("\n"),
              }}
            />
          </>
        )}

        <HeadInjections injections={injections} />
      </head>
      <body className="antialiased">
        {isPublicShare ? children : (
          <AppProvider initialData={vaultData}>
            <AuthProvider initialUser={session?.user ?? null}>
              {children}
              <AdminTools />
              <Toaster position="bottom-left" expand={false} richColors />
            </AuthProvider>
          </AppProvider>
        )}

        <BodyEndInjections injections={injections} />
      </body>
    </html>
  );
}
