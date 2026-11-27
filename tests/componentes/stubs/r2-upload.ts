// Stub de lib/r2/upload para pruebas de componentes: no sube nada, devuelve una URL fija.
export async function uploadFileToR2(): Promise<{ ok: true; url: string }> {
  return { ok: true, url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>' }
}
export async function clonarUrlAR2(url: string): Promise<{ ok: true; url: string }> {
  return { ok: true, url }
}
