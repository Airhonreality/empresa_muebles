// Adaptador de almacenamiento (t-200). Único punto del módulo que conoce R2.
// La capa 1 recibe `subir` por inyección y no importa lib/r2 directamente.
import { clonarUrlAR2, uploadFileToR2 } from '@/lib/r2/upload'
import { esUrlR2 } from '@/lib/r2/sanitize'
import { prepararParaSubida } from './normalizar-navegador'

export type Subir = (archivo: File) => Promise<string>

/** Sube un archivo a R2 bajo `prefijo` y devuelve la URL canónica. */
export function crearSubidaR2(prefijo: string): Subir {
  return async (archivo) => {
    const optimizado = await prepararParaSubida(archivo)
    const formData = new FormData()
    formData.append('file', optimizado)
    formData.append('prefix', prefijo)
    const resultado = await uploadFileToR2(formData)
    if (!resultado.ok) throw new Error(resultado.error)
    return resultado.url
  }
}

/** Convierte una URL externa en una URL de R2. Si ya es de R2, la devuelve sin cambios. */
export async function asegurarUrlR2(url: string, prefijo: string): Promise<string> {
  if (esUrlR2(url)) return url
  const resultado = await clonarUrlAR2(url, prefijo)
  if (!resultado.ok) throw new Error(resultado.error)
  return resultado.url
}
