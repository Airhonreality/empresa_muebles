import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { getVaultData } from "@/core/server/vault";
import fs from "fs/promises";
import path from "path";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agnostic System",
  description: "A professional, storage-based agnostic framework",
};

/**
 * Root Layout (Next.js 15 High-Performance Architecture)
 * 
 * 1. Atomic Style Injection: Inject CSS variables BEFORE hydration to eliminate FOUC.
 * 2. Server-Side Data Prefetch: Load Materia Vault on the server and pass to the client context.
 * 3. Streaming Support: Prepare the layout for granular Suspense boundaries.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storagePath = process.env.STORAGE_PATH || 'storage/default';
  
  // 1. Fetch data on the server
  const vaultData = await getVaultData();

  // 2. Read styles for injection (Zero-Flash strategy)
  let themeStyles = "";
  try {
    const cssPath = path.join(process.cwd(), storagePath, "styles", "theme.css");
    themeStyles = await fs.readFile(cssPath, "utf-8");
  } catch (e) {
    console.error("Layout: Could not load theme.css for injection", e);
  }

  return (
    <html lang="en" className="scrollbar-hide">
      <head>
        {/* Atomic Style Injection - Prevents white/blue flash */}
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <AppProvider initialData={vaultData}>
          <AuthProvider>
            <Suspense fallback={<div className="h-screen bg-background flex items-center justify-center animate-pulse text-muted-foreground font-mono text-xs tracking-widest uppercase">Initializing Satellite...</div>}>
              {children}
            </Suspense>
            <Toaster position="top-right" expand={false} richColors />
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}
