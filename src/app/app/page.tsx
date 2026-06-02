import { getVaultData } from '@/core/server/vault'
import { resolveAgnosticRoute } from '@/lib/agnostic/resolver'
import { AgnosticShell } from '@/components/agnostic/engine/AgnosticShell'
import { AgnosticGuard } from '@/components/agnostic/layouts/AgnosticGuard'
import { SYSTEM_NS } from '@/lib/agnostic/constants'

// /app root → renders /app/dashboard via engine (role-aware blocks via page_routes.json)
export default async function AppDashboard() {
  const fullSlug = ['app', 'dashboard']

  const coreContexts = [SYSTEM_NS.ROUTES, SYSTEM_NS.SCHEMAS]
  const coreData = await getVaultData(coreContexts)
  const partialResolution = await resolveAgnosticRoute(fullSlug, coreData)

  if (!partialResolution.route) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <h1 className="text-2xl font-black tracking-tight">Bienvenido al ERP</h1>
        <p className="text-muted-foreground text-sm">Selecciona un módulo en el menú superior para comenzar.</p>
      </div>
    )
  }

  const contextsToHydrate = [...new Set([
    ...coreContexts,
    ...(partialResolution.allContexts || []),
  ])]

  const initialData = await getVaultData(contextsToHydrate)
  const resolution = await resolveAgnosticRoute(fullSlug, initialData)

  const content = <AgnosticShell initialData={initialData} resolution={resolution} />

  const routeData = (resolution.route?.data as any) ?? {}
  const allowedLists: string[] = routeData.allowed_lists ?? []
  const requiredRole: string | null = routeData.requiredRole ?? null
  const needsGuard = allowedLists.length > 0 || !!requiredRole

  return needsGuard ? (
    <AgnosticGuard allowedLists={allowedLists} requiredRole={requiredRole}>
      {content}
    </AgnosticGuard>
  ) : content
}
