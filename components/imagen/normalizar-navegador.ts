// Capa 1 (t-200): normalización en el navegador. Usa APIs de DOM/canvas, por eso vive aquí
// y no en lib/imagen/ (capa 0 sin DOM). Copia temporal de prepareImageForUpload de
// components/veta/image-picker.tsx; P5 elimina el original cuando no quede ningún consumidor.

/** Umbral a partir del cual se re-codifica. Debajo, la imagen pasa tal cual. */
const UMBRAL_BYTES = 3 * 1024 * 1024
const MAX_DIM = 2560

export async function prepararParaSubida(file: File): Promise<File> {
  if (file.size <= UMBRAL_BYTES) return file
  if (typeof window === 'undefined' || typeof document === 'undefined') return file

  return new Promise((resolve) => {
    const img = document.createElement('img')
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          } else {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(file)

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file)
            const nombre = file.name.replace(/\.[^/.]+$/, '') + '.webp'
            resolve(new File([blob], nombre, { type: 'image/webp', lastModified: Date.now() }))
          },
          'image/webp',
          0.9,
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
