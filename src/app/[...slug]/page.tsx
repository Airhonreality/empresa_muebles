'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { PageComposer } from '@/components/PageComposer';
import { DynamicModuleHost } from '@/components/DynamicModuleHost';
import type { Block } from '@/components/PageComposer';

interface PageRoute {
  path: string;
  title: string;
  module?: string;
  blocks?: Block[];
}

export default function DynamicPage() {
  const pathname = usePathname();
  const { state } = useAppContext();

  if (state.system.isLoading) {
    return (
      <main style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading&hellip;
      </main>
    );
  }

  const routeItems = state.data['page_routes'] ?? [];
  const route = routeItems
    .map(item => item.data as unknown as PageRoute)
    .find(r => r.path === pathname);

  if (!route) {
    return (
      <main style={{ padding: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          No page route configured for <code>{pathname}</code>
        </p>
        <Link href="/schema" style={{ color: 'var(--accent)' }}>
          &rarr; Configure in Schema Builder
        </Link>
      </main>
    );
  }

  if (route.module) {
    return <DynamicModuleHost moduleName={route.module} />;
  }

  return (
    <main>
      <PageComposer blocks={route.blocks ?? []} />
    </main>
  );
}
