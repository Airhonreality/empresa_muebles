import { getVaultData } from '@/core/server/vault';
import { resolveAgnosticRoute } from '@/lib/agnostic/resolver';
import { AgnosticShell } from '@/components/agnostic/engine/AgnosticShell';
import { AgnosticGuard } from '@/components/agnostic/layouts/AgnosticGuard';
import { Layers } from 'lucide-react';
import { Metadata } from 'next';
import { SYSTEM_NS } from '@/lib/agnostic/constants';

export const metadata: Metadata = {
  title: 'Cargando Proyección...',
};

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

// Todas las rutas bajo /app/** pasan por aquí → activa src/app/app/layout.tsx (navbar ERP)
export default async function AppRoute({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = ['app', ...slug];

  const coreContexts = [SYSTEM_NS.ROUTES, SYSTEM_NS.SCHEMAS];
  const coreData = await getVaultData(coreContexts);
  const partialResolution = await resolveAgnosticRoute(fullSlug, coreData);

  if (!partialResolution.route) {
    const path = `/app/${slug.join('/')}`;
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
        <Layers size={48} className="text-muted-foreground/20 mb-6" />
        <h1 className="text-4xl font-black tracking-tighter mb-2 italic">404: Uncharted Entity</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-xs">
          The projection '{path}' does not exist in the current DNA.
        </p>
      </div>
    );
  }

  const contextsToHydrate = [...new Set([
    ...coreContexts,
    ...(partialResolution.allContexts || [])
  ])];

  const initialData = await getVaultData(contextsToHydrate);
  const resolution = await resolveAgnosticRoute(fullSlug, initialData);

  const content = (
    <AgnosticShell
      initialData={initialData}
      resolution={resolution}
    />
  );

  const routeData = (resolution.route?.data as any) ?? {};
  const allowedLists: string[] = routeData.allowed_lists ?? [];
  const requiredRole: string | null = routeData.requiredRole ?? null;
  const needsGuard = allowedLists.length > 0 || !!requiredRole;

  return needsGuard ? (
    <AgnosticGuard allowedLists={allowedLists} requiredRole={requiredRole}>
      {content}
    </AgnosticGuard>
  ) : content;
}
