// t-188: datos de usuario para Enhanced Conversions en el navegador.
//
// Google Ads acepta `sha256_phone_number` / `sha256_email_address` como SHA-256 hexadecimal
// de los valores normalizados. Sin esto el pixel dispara la conversión "anónima" y el matching
// automático de Google tiene mucho menos con qué cruzar el clic con la persona.

export interface UserDataGtag {
  sha256_phone_number?: string
  sha256_email_address?: string
  name?: string
}

/** Normaliza a E.164 asumiendo Colombia cuando el número viene sin prefijo país. */
export function normalizarTelefonoE164(raw?: string | null): string | null {
  if (!raw) return null
  const limpio = raw.trim()
  if (!limpio) return null

  const digitos = limpio.replace(/\D/g, '')
  if (!digitos) return null

  if (digitos.length === 10) return `+57${digitos}`
  if (digitos.length === 11 && digitos.startsWith('0')) return `+57${digitos.slice(1)}`
  if (digitos.length === 12 && digitos.startsWith('57')) return `+${digitos}`
  if (digitos.length > 10 && digitos.length <= 15) return `+${digitos}`

  return null
}

export async function sha256Hex(value: string): Promise<string | null> {
  try {
    const subtle = globalThis.crypto?.subtle
    if (!subtle) return null
    const bytes = new TextEncoder().encode(value)
    const digest = await subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null
  }
}

export async function construirUserDataGtag({
  telefono,
  email,
  nombre,
}: {
  telefono?: string | null
  email?: string | null
  nombre?: string | null
}): Promise<UserDataGtag> {
  const userData: UserDataGtag = {}

  const telefonoNormalizado = normalizarTelefonoE164(telefono)
  if (telefonoNormalizado) {
    const hash = await sha256Hex(telefonoNormalizado)
    if (hash) userData.sha256_phone_number = hash
  }

  const emailLimpio = email?.trim().toLowerCase()
  if (emailLimpio) {
    const hash = await sha256Hex(emailLimpio)
    if (hash) userData.sha256_email_address = hash
  }

  const nombreLimpio = nombre?.trim()
  if (nombreLimpio) {
    userData.name = nombreLimpio
  }

  return userData
}
