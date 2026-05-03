import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { getVaultData } from "@/core/server/vault";
import fs from "fs/promises";
import path from "path";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agnostic System",
  description: "A professional, storage-based agnostic framework",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storagePath = process.env.STORAGE_PATH || 'storage/default';
  const vaultData = await getVaultData();

  let themeStyles = "";
  try {
    const cssPath = path.join(process.cwd(), storagePath, "styles", "theme.css");
    themeStyles = await fs.readFile(cssPath, "utf-8");
  } catch (e) {
    // Silent fail for styles if not present
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style id="agnostic-theme" dangerouslySetInnerHTML={{ __html: themeStyles }} />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <AppProvider initialData={vaultData}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" expand={false} richColors />
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  );
}
