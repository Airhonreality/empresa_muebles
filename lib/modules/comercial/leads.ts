// Lógica de la fila `leads`: matriz de transiciones y detección de riesgo comercial.
// Funciones puras: no dependen del store ni del reloj real (el instante entra por parámetro),
// se testean en aislamiento con `npx tsx lib/modules/comercial/leads.test.ts`.
//
// Origen de estas reglas: incidente del 2026-09-30 (Cocina Integral Chía, $73.078.700 COP).
// Un lead quedó en `cotizado` con observaciones de contrato sin responder durante 24 h y el
// cliente cerró con otro proveedor. La etapa nunca se movía porque no existía ninguna acción
// que la moviera: `etapa` tenía 6 valores y solo se escribía el inicial.
//
// Estas funciones NO detectan el silencio por sí solas (eso requiere los mensajes de WhatsApp,
// ver arnes/lineas/respuesta_cliente/plan_respuesta_cliente.md). Lo que hacen es acotar la pregunta: una vez que
// la etapa avance, el lead en riesgo se detecta por reloj en vez de por lectura de texto.

/** Espejo 1:1 del enum `estado_lead` de lib/db/schema.ts. */
export const LEAD_ETAPAS = [
  'nuevo_lead',
  'contactado',
  'asesoria_agendada',
  'cotizado',
  'contrato_firmado',
  'descartado',
] as const

export type LeadEtapa = (typeof LEAD_ETAPAS)[number]

export function esLeadEtapa(valor: unknown): valor is LeadEtapa {
  return typeof valor === 'string' && (LEAD_ETAPAS as readonly string[]).includes(valor)
}

/** Estados sin salida: no se transicionan, y un lead aquí ya no se monitorea. */
export const ETAPAS_TERMINALES_LEAD: readonly LeadEtapa[] = ['contrato_firmado', 'descartado']

/**
 * Matriz por defecto. Es el mismo criterio del kanban comercial (`transiciones_proyecto`):
 * se puede sobreescribir por parámetro con `normalizarMatrizTransiciones`.
 *
 * `cotizado → descartado` está permitido a propósito: es la transición que usó el incidente de
 * Chía. Si no existiera, el lead que se perdió quedaría atrapado en `cotizado` para siempre y
 * el detector de silencio lo seguiría marcando como crítico. Descartar un lead es una decisión
 * comercial legítima y tiene que poder registrarse aunque duela.
 */
export const TRANSICIONES_LEAD: Record<LeadEtapa, LeadEtapa[]> = {
  nuevo_lead: ['contactado', 'descartado'],
  contactado: ['asesoria_agendada', 'cotizado', 'descartado'],
  asesoria_agendada: ['cotizado', 'descartado'],
  cotizado: ['contrato_firmado', 'descartado'],
  contrato_firmado: [],
  descartado: [],
}

export function transicionLeadValida(actual: string, destino: string, matriz: Record<string, string[]> = TRANSICIONES_LEAD): boolean {
  return (matriz[actual] ?? []).includes(destino)
}

/**
 * Valida una matriz de transiciones que venga del parámetro `transiciones_lead`.
 * Devuelve `null` si no es un objeto plano de etapa→etapas legítimas, para que el llamador
 * caiga en la matriz por defecto en vez de dejar al sistema sin transiciones válidas.
 */
export function normalizarMatrizTransiciones(valor: unknown): Record<string, LeadEtapa[]> | null {
  if (typeof valor === 'string') {
    try {
      return normalizarMatrizTransiciones(JSON.parse(valor))
    } catch {
      return null
    }
  }
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return null

  const salida: Record<string, LeadEtapa[]> = {}
  for (const [origen, destinos] of Object.entries(valor as Record<string, unknown>)) {
    if (!esLeadEtapa(origen)) return null
    if (!Array.isArray(destinos)) return null
    const lista: LeadEtapa[] = []
    for (const destino of destinos) {
      if (!esLeadEtapa(destino)) return null
      if (destino === origen) return null
      lista.push(destino)
    }
    salida[origen] = lista
  }
  // Toda etapa debe tener entrada: si falta una, ese lead no podría transicionar nunca.
  for (const etapa of LEAD_ETAPAS) {
    if (!(etapa in salida)) return null
  }
  return salida
}

// ── Detección de riesgo ────────────────────────────────────────────────────────

export type NivelRiesgoLead = 'critico' | 'atencion'

/** Mínimo de `leads` que estas funciones necesitan. Evita acoplar el módulo al schema. */
export interface LeadParaEvaluar {
  etapa: string
  createdAt: string
  updatedAt: string
  proyectoId: string | null
}

export interface RiesgoLead {
  nivel: NivelRiesgoLead
  /** Clave del parámetro que dispara la regla, para trazabilidad al cambio de política. */
  regla: string
  /** Texto ya con las horas calculadas: es lo que se muestra al comercial. */
  motivo: string
  horasTranscurridas: number
}

export interface UmbralesRiesgoLead {
  cotizadoSilencioHoras: number
  nuevoSinContactoHoras: number
}

export const UMBRALES_RIESGO_LEAD: UmbralesRiesgoLead = {
  cotizadoSilencioHoras: 48,
  nuevoSinContactoHoras: 24,
}

function horasDesde(marca: string, ahoraIso: string): number {
  const desde = Date.parse(marca)
  const ahora = Date.parse(ahoraIso)
  if (!Number.isFinite(desde) || !Number.isFinite(ahora)) return 0
  return Math.max(0, (ahora - desde) / 3_600_000)
}

function redondearHoras(h: number): number {
  return Math.floor(h)
}

/**
 * Devuelve el riesgo del lead, o `null` si no hay ninguno. Evalúa en orden de gravedad.
 *
 * Las tres reglas:
 *  1. `cotizado` sin movimiento — ESTA ES LA DEL INCIDENTE. Un lead cotizado que no avanza
 *     está esperando algo (contrato, ajuste, respuesta) y es el candidato a perder $millones.
 *  2. `contrato_firmado` sin proyecto — plata won que no existe en ningún lado. O el alta del
 *     proyecto se olvidó, o el lead se marcó firmado sin contrato. Ambas son graves y ninguna
 *     aparece en ningún reporte.
 *  3. `nuevo_lead` sin tocar — no es tan grave, pero si nadiecontactó en 24 h el lead ya se
 *     enfrió y la pauta está pagando por tráfico que no contesta.
 *
 * El reloj de la regla 1 es `updatedAt`, no `createdAt`: cuenta el silencio desde el último
 * toque real, que es lo que un cliente percibe como abandono.
 */
export function evaluarRiesgoLead(
  lead: LeadParaEvaluar,
  ahoraIso: string,
  umbrales: UmbralesRiesgoLead = UMBRALES_RIESGO_LEAD,
): RiesgoLead | null {
  if (!esLeadEtapa(lead.etapa)) return null

  if (lead.etapa === 'cotizado') {
    const horas = horasDesde(lead.updatedAt, ahoraIso)
    if (horas >= umbrales.cotizadoSilencioHoras) {
      return {
        nivel: 'critico',
        regla: 'lead_cotizado_silencio_horas',
        motivo: `Cotizado hace ${redondearHoras(horas)} h sin avanzar. Es el patrón exacto del incidente del 30/09: el cliente escribe, no recibe respuesta y se va.`,
        horasTranscurridas: redondearHoras(horas),
      }
    }
    return null
  }

  if (lead.etapa === 'contrato_firmado') {
    if (!lead.proyectoId) {
      return {
        nivel: 'critico',
        regla: 'lead_contrato_sin_proyecto',
        motivo: 'Contrato firmado sin proyecto asociado: la venta existe pero no aparece en operación, cronograma ni facturación.',
        horasTranscurridas: 0,
      }
    }
    return null
  }

  if (lead.etapa === 'nuevo_lead') {
    const horas = horasDesde(lead.createdAt, ahoraIso)
    if (horas >= umbrales.nuevoSinContactoHoras) {
      return {
        nivel: 'atencion',
        regla: 'lead_nuevo_sin_contacto_horas',
        motivo: `Lead nuevo sin ningún contacto en ${redondearHoras(horas)} h. La pauta lo pagó y todavía nadie lo toko.`,
        horasTranscurridas: redondearHoras(horas),
      }
    }
  }

  return null
}