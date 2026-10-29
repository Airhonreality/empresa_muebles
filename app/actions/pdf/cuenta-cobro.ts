'use server'

import { generarPDFCuentaCobro, type CuentaCobroPDFInput } from '@/lib/pdf/cuenta-cobro'

/**
 * Server action para generar PDF de cuenta de cobro.
 * Uso: const resultado = await generarPDFCuentaCobroAction(input)
 * Retorna { ok: true, pdfBase64, filename } o { ok: false, error }
 */
export async function generarPDFCuentaCobroAction(input: CuentaCobroPDFInput) {
  try {
    const pdfBuffer = await generarPDFCuentaCobro(input)
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

    return {
      ok: true,
      pdfBase64,
      filename: `cuenta-de-cobro_${input.numeroDocumento}.pdf`,
    }
  } catch (error) {
    console.error('[generarPDFCuentaCobroAction]', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
