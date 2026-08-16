'use server';

import { generarPDFCotizacion, type CotizacionPDFInput } from '@/lib/pdf/cotizacion';

/**
 * Server action para generar PDF de cotización
 * Uso: await generarPDFCotizacionAction(input)
 */
export async function generarPDFCotizacionAction(input: CotizacionPDFInput) {
  try {
    const pdfBuffer = await generarPDFCotizacion(input);
    
    // Crear respuesta con el PDF
    const response = new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion_${input.proposalNumber}.pdf"`,
      },
    });
    
    return response;
  } catch (error) {
    console.error('[generarPDFCotizacionAction]', error);
    throw new Error(`Error generando PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}
