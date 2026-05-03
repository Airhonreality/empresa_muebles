import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { StyleInjector } from '@/components/StyleInjector';

export const metadata: Metadata = {
  title: 'Agnostic Seed',
  description: 'Data-driven application framework',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <StyleInjector />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
