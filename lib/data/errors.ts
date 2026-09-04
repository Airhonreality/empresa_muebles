// lib/data/errors.ts
// Errores de negocio reutilizables — sin 'use server', importables desde
// cualquier lado (servidor, cliente, tests).

/**
 * Error de negocio para eliminaciones de variantes rechazadas por la Guardia de
 * Integridad (ZN-003): no se borran variantes que ya entraron a producción
 * (tienen BOM en bom_material o módulos propios en modulos).
 */
export class VarianteNoEliminableError extends Error {
  constructor(motivo: string) {
    super(motivo)
    this.name = 'VarianteNoEliminableError'
  }
}