export type ProjectDraft = {
  projectId: string
  projectData: {
    nombre_proyecto: string
    estado: 'activa'
  }
  publicProposalId: string
  publicProposalData: {
    proyecto_id: string
    public_slug: string
    snapshot_json: Record<string, unknown>
    estado: 'borrador'
  }
}

export function createPublicSlug(title?: string) {
  const editorialPart = (title || 'propuesta')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'propuesta'

  return `${editorialPart}-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
}

export function createProjectDraft(nombreProyecto = 'Nuevo Proyecto'): ProjectDraft {
  const projectId = crypto.randomUUID()
  const publicProposalId = crypto.randomUUID()

  return {
    projectId,
    projectData: {
      nombre_proyecto: nombreProyecto,
      estado: 'activa',
    },
    publicProposalId,
    publicProposalData: {
      proyecto_id: projectId,
      public_slug: createPublicSlug(nombreProyecto),
      snapshot_json: {},
      estado: 'borrador',
    },
  }
}
