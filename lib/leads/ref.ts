// t-188: referencia corta y legible que viaja en el mensaje de WhatsApp.
//
// El enlace clic -> persona se hace por TELÉFONO (el que se escribe en el formulario es el
// mismo que aparece en la conversación de WhatsApp). La referencia es una segunda llave para
// los casos en que un mismo teléfono tiene varias conversiones (varios leads) y para que el
// equipo pueda ubicar la fila exacta en el ERP cuando revisa el chat.

const REF_PREFIJO = 'VD-'
const REF_LARGO = 8

export function generarRefLead(leadId: string): string {
  const limpio = leadId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const cuerpo = limpio.slice(0, REF_LARGO)
  return `${REF_PREFIJO}${cuerpo || '00000000'}`
}

export interface MensajeWhatsAppInput {
  nombre?: string | null
  tipoProyecto?: string | null
  ubicacion?: string | null
}

/** Mensaje pre-llenado del primer contacto. Nunca inventa un nombre: si no hay, saluda sin él. */
export function construirMensajeWhatsApp({
  nombre,
  tipoProyecto,
  ubicacion,
}: MensajeWhatsAppInput): string {
  const nombreLimpio = nombre?.trim()
  const tipo = tipoProyecto?.trim() || 'Cocina'
  const ubi = ubicacion?.trim() || 'Bogotá'

  const saludo = nombreLimpio
    ? `Hola Veta Dorada, mi nombre es ${nombreLimpio}.`
    : 'Hola Veta Dorada.'

  return `${saludo} Estoy interesado en un proyecto de ${tipo} en ${ubi}. Solicito mi asesoría.`
}

export function construirUrlWhatsApp(numero: string, mensaje: string): string {
  return `https://api.whatsapp.com/send/?phone=${numero}&text=${encodeURIComponent(mensaje)}`
}
