// Capa 0 (t-200): proyección PÚBLICA de las imágenes. Lo que sale a la propuesta pública del
// cliente sale SOLO por aquí: el alt, el pie y los campos del slot marcados `publica: true`.
// Cualquier otro valor interno se descarta en el servidor, nunca en el navegador.
import type { CamposSlot, ImagenGuardada } from './tipos'

export interface TextoPublico {
  etiqueta: string
  valor: string
}

export interface ImagenPublica {
  url: string
  alt: string
  pie?: string
  textos: TextoPublico[]
}

export function publicarImagenes<C extends CamposSlot>(guardadas: readonly ImagenGuardada[], campos: C | undefined): ImagenPublica[] {
  const publicos = Object.entries(campos ?? {}).filter(([, def]) => def.publica === true)
  return guardadas.map((img) => {
    const textos: TextoPublico[] = []
    for (const [clave, def] of publicos) {
      const valor = img.valores?.[clave]
      if (typeof valor === 'string' && valor.trim()) textos.push({ etiqueta: def.etiqueta, valor: valor.trim() })
    }
    const out: ImagenPublica = { url: img.url, alt: img.alt ?? '', textos }
    if (img.pie) out.pie = img.pie
    return out
  })
}
