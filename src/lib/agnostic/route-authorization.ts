interface RouteUser {
  role?: string | null
  metadata?: Record<string, unknown> | null
}

interface RouteAccess {
  allowed_lists?: string[]
  requiredRole?: string | null
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function isRouteAuthorized(user: RouteUser, access: RouteAccess): boolean {
  const allowedLists = (access.allowed_lists ?? []).map(normalize)
  const requiredRole = access.requiredRole ? normalize(access.requiredRole) : null
  if (allowedLists.length === 0 && !requiredRole) return true

  const identities = new Set<string>()
  if (user.role) identities.add(normalize(user.role))
  const metadataTypes = user.metadata?.type
  if (Array.isArray(metadataTypes)) {
    metadataTypes.forEach((value) => {
      if (typeof value === 'string') identities.add(normalize(value))
    })
  }

  if (identities.has('admin') || identities.has('administrador')) return true
  if (allowedLists.length > 0 && [...identities].some((identity) => allowedLists.includes(identity))) return true
  return requiredRole ? identities.has(requiredRole) : false
}
