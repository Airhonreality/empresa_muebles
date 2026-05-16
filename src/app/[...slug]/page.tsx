/**
 * 🏛️ ARTEFACTO: page.tsx (MasterRoute)
 * ────────────
 * CAPA: Orchestration (Deterministic Server Entry Point)
 * VERSIÓN: 11.0 (Sovereign Edition)
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Resolución determinista de DNA, Manifiesto y Materia en el SERVIDOR.
 * - Garantía de la 'Triple Alianza de Datos': Ruta + ADN + Materia.
 * - Eliminación total de la entropía de carga (Zero FOUC).
 * 
 * 📜 ADR: [2026-05-15] TRIPLE_DATA_ALLIANCE
 * - DECISIÓN: El servidor debe inyectar siempre los contextos de infraestructura (ADN/Rutas) junto con la materia.
 * - MOTIVO: Evitar la ceguera selectiva del cliente; un bloque sin su ADN es ruido entrópico.
 * - IMPACTO: Hidratación total y determinista; el cliente nunca 'adivina' la estructura.
 * 
 * 🛡️ AXIOMAS:
 * - AXIOMA DE PROYECCIÓN: Una ruta sin su ADN no es una página, es ruido.
 * - AXIOMA DE SOBERANÍA: Solo el servidor conoce la Realidad; el cliente es un proyector de sombras.
 * 
 * ⚠️ ANTI-AXIOMAS:
 * - ANTI-AXIOMA DE LA HIDRATACIÓN TACAÑA: Nunca envíes un bloque sin su estructura; la búsqueda de ADN en el cliente es un fallo arquitectónico.
 */
import { getVaultData } from '@/core/server/vault';
import { resolveAgnosticRoute } from '@/lib/agnostic/resolver';
import { AgnosticShell } from '@/components/agnostic/engine/AgnosticShell';
import { AgnosticGuard } from '@/components/agnostic/layouts/AgnosticGuard';
import { Layers } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cargando Proyección...',
};

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function MasterRoute({ params }: PageProps) {
  const { slug } = await params;
  
  // 1. RESOLUCIÓN DE INFRAESTRUCTURA: Traemos el mapa para saber dónde estamos
  // Solicitamos los contextos críticos para la resolución inicial
  const coreContexts = ['page_routes', 'schema_definitions', 'vault_manifest'];
  const coreData = await getVaultData(coreContexts);
  const resolution = await resolveAgnosticRoute(slug, coreData);

  if (!resolution.route) {
    const path = Array.isArray(slug) ? `/${slug.join('/')}` : `/${slug}`;
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

  // 2. CRISTALIZACIÓN DE LA TRIPLE ALIANZA:
  // Inyectamos ADN, Rutas, Manifiesto y la Materia específica de esta ruta.
  const contextsToHydrate = [...coreContexts];
  if (resolution.context && resolution.context !== 'system') {
    contextsToHydrate.push(resolution.context);
  }

  const initialData = await getVaultData(contextsToHydrate);

  // 3. THE SOVEREIGN SHELL: Proyectamos la realidad hidratada
  const content = (
    <AgnosticShell 
      initialData={initialData} 
      resolution={resolution} 
    />
  );

  const requiredRole = (resolution.route.data as any)?.requiredRole;

  return requiredRole ? (
    <AgnosticGuard requiredRole={requiredRole}>
      {content}
    </AgnosticGuard>
  ) : content;
}
