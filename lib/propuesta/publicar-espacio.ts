// Proyección PÚBLICA de un espacio para la propuesta (t-200). Pura: sin base de datos.
// Retira las imágenes completas (pueden traer valores internos) y deja solo `imagenesPublicas`,
// filtrado por la bandera `publica` que declara cada slot en lib/imagen/slots/cotizador.ts.
import { normalizarDescripcion } from '@/lib/data/contenedores'
import { publicarImagenes, type ImagenPublica } from '@/lib/imagen/publica'
import { SLOTS_ESPACIO } from '@/lib/imagen/slots/cotizador'
import type { ImagenGuardada } from '@/lib/imagen/tipos'

export interface EspacioConImagenes {
  descripcion?: string | null
  imagenesEspacio?: ImagenGuardada[]
  imagenesDisenio?: ImagenGuardada[]
  imagenesReferencia?: ImagenGuardada[]
}

export function publicarEspacio<T extends EspacioConImagenes>(e: T) {
  const { imagenesEspacio, imagenesDisenio, imagenesReferencia, ...resto } = e
  return {
    ...resto,
    descripcion: normalizarDescripcion(e.descripcion),
    imagenesPublicas: {
      espacio: publicarImagenes(imagenesEspacio ?? [], SLOTS_ESPACIO.espacio.campos),
      disenio: publicarImagenes(imagenesDisenio ?? [], SLOTS_ESPACIO.disenio.campos),
      referencia: publicarImagenes(imagenesReferencia ?? [], SLOTS_ESPACIO.referencia.campos),
    } as { espacio: ImagenPublica[]; disenio: ImagenPublica[]; referencia: ImagenPublica[] },
  }
}
