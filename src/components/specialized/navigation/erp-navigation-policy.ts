export type ErpCapability =
  | 'dashboard:view'
  | 'commercial:view'
  | 'projects:view'
  | 'production:view'
  | 'finance:view'
  | 'calendar:view'
  | 'catalog:view'
  | 'portfolio:view'
  | 'team:view'
  | 'suppliers:view'
  | 'settings:view'
  | 'profile:view'

const ROLE_CAPABILITIES: Record<string, readonly (ErpCapability | '*')[]> = {
  admin: ['*'],
  administrador: ['*'],
  comercial: [
    'dashboard:view',
    'commercial:view',
    'projects:view',
    'calendar:view',
    'catalog:view',
    'portfolio:view',
    'profile:view',
  ],
  produccion: [
    'dashboard:view',
    'projects:view',
    'production:view',
    'calendar:view',
    'catalog:view',
    'suppliers:view',
    'profile:view',
  ],
  finanzas: [
    'dashboard:view',
    'projects:view',
    'finance:view',
    'calendar:view',
    'suppliers:view',
    'profile:view',
  ],
  cliente: [],
}

function normalizeRole(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function resolveCapabilities(role: string | null | undefined, metadataTypes: unknown): Set<string> {
  const roles = new Set<string>()
  if (role) roles.add(normalizeRole(role))
  if (Array.isArray(metadataTypes)) {
    metadataTypes.forEach((value) => {
      if (typeof value === 'string') roles.add(normalizeRole(value))
    })
  }

  const capabilities = new Set<string>()
  roles.forEach((currentRole) => {
    ROLE_CAPABILITIES[currentRole]?.forEach((capability) => capabilities.add(capability))
  })
  return capabilities
}

export function canAccess(capabilities: Set<string>, requiredCapability?: string): boolean {
  return !requiredCapability || capabilities.has('*') || capabilities.has(requiredCapability)
}
