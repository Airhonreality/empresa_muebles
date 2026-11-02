import assert from 'node:assert/strict'
import {
  ETAPAS_TERMINALES_LEAD,
  LEAD_ETAPAS,
  TRANSICIONES_LEAD,
  UMBRALES_RIESGO_LEAD,
  esLeadEtapa,
  evaluarRiesgoLead,
  normalizarMatrizTransiciones,
  transicionLeadValida,
  type LeadParaEvaluar,
} from './leads'

const AHORA = '2026-10-01T12:00:00.000Z'

function horasAtras(horas: number): string {
  return new Date(Date.parse(AHORA) - horas * 3_600_000).toISOString()
}

function lead(over: Partial<LeadParaEvaluar> = {}): LeadParaEvaluar {
  const base: LeadParaEvaluar = {
    etapa: 'cotizado',
    createdAt: horasAtras(100),
    updatedAt: AHORA,
    proyectoId: 'proj-1',
  }
  return { ...base, ...over }
}

function run(): void {
  // --- Integridad de la matriz ----------------------------------------------
  for (const etapa of LEAD_ETAPAS) {
    assert.ok(Array.isArray(TRANSICIONES_LEAD[etapa]), `${etapa} tiene lista de destinos`)
    for (const destino of TRANSICIONES_LEAD[etapa]) {
      assert.ok(LEAD_ETAPAS.includes(destino), `${etapa} → ${destino} es una etapa real`)
      assert.notEqual(destino, etapa, `${etapa} no se auto-transiciona`)
    }
  }
  // Toda etapa terminal no tiene salida: si la tuviera, un lead descartado podría volver.
  for (const etapa of ETAPAS_TERMINALES_LEAD) {
    assert.deepEqual(TRANSICIONES_LEAD[etapa], [], `${etapa} es terminal`)
  }

  // --- transicionLeadValida --------------------------------------------------
  assert.equal(transicionLeadValida('nuevo_lead', 'contactado'), true, 'camino normal')
  assert.equal(transicionLeadValida('cotizado', 'contrato_firmado'), true, 'cierre de venta')
  // El incidente de Chía se resolvió como `cotizado → descartada`. Si esto fuera inválido,
  // el lead perdido quedaría atrapado y el detector lo marcaría crítico para siempre.
  assert.equal(transicionLeadValida('cotizado', 'descartado'), true, 'pérdida registrable')
  assert.equal(transicionLeadValida('nuevo_lead', 'contrato_firmado'), false, 'no salta etapas')
  assert.equal(transicionLeadValida('contrato_firmado', 'cotizado'), false, 'terminal no sale')
  assert.equal(transicionLeadValida('inventada', 'cotizado'), false, 'origen desconocido')
  assert.equal(transicionLeadValida('cotizado', 'inventada'), false, 'destino desconocido')

  // --- esLeadEtapa -----------------------------------------------------------
  assert.equal(esLeadEtapa('cotizado'), true, 'etapa válida')
  assert.equal(esLeadEtapa('en_revision'), false, 'estado de proyecto no es de lead')
  assert.equal(esLeadEtapa(null), false, 'null no es etapa')

  // --- normalizarMatrizTransiciones -----------------------------------------
  const override = JSON.stringify({ cotizado: ['descartado'] })
  // Incompleta (faltan etapas) → null, para que el llamador use la matriz por defecto.
  assert.equal(normalizarMatrizTransiciones(override), null, 'matriz incompleta se rechaza')
  assert.equal(normalizarMatrizTransiciones('no-json'), null, 'json inválido se rechaza')
  assert.equal(normalizarMatrizTransiciones('["cotizado"]'), null, 'array se rechaza')
  assert.equal(normalizarMatrizTransiciones({ cotizado: ['inventada'] }), null, 'destino desconocido se rechaza')
  assert.equal(normalizarMatrizTransiciones({ cotizado: ['cotizado'] }), null, 'auto-transición se rechaza')

  const completa = normalizarMatrizTransiciones(
    JSON.stringify(Object.fromEntries(LEAD_ETAPAS.map((e) => [e, []]))),
  )
  assert.ok(completa !== null, 'matriz completa se acepta')
  assert.equal(transicionLeadValida('cotizado', 'contactado', completa!), false, 'la override manda')

  // --- evaluarRiesgoLead: regla 1, la del incidente ---------------------------
  const enSilencio = evaluarRiesgoLead(
    lead({ etapa: 'cotizado', updatedAt: horasAtras(49) }),
    AHORA,
  )
  assert.equal(enSilencio?.nivel, 'critico', '49 h cotizado es crítico')
  assert.equal(enSilencio?.regla, 'lead_cotizado_silencio_horas', 'dispara la regla 1')
  assert.equal(enSilencio?.horasTranscurridas, 49, 'horas redondeadas hacia abajo')

  // Exactamente en el umbral todavía no es crítico (límite es inclusivo desde el umbral).
  assert.equal(evaluarRiesgoLead(lead({ etapa: 'cotizado', updatedAt: horasAtras(48) }), AHORA)?.nivel, 'critico', 'en el umbral ya es crítico')
  assert.equal(evaluarRiesgoLead(lead({ etapa: 'cotizado', updatedAt: horasAtras(47) }), AHORA), null, '47 h todavía no')

  // El reloj es el último toque, no la creación: un lead cotizado hace 200 h que se tocó
  // hace 2 h NO es riesgo de abandono.
  assert.equal(
    evaluarRiesgoLead(lead({ etapa: 'cotizado', createdAt: horasAtras(200), updatedAt: horasAtras(2) }), AHORA),
    null,
    'silencio se cuenta desde updatedAt',
  )

  // --- evaluarRiesgoLead: regla 2, contrato sin proyecto ----------------------
  const firmado = evaluarRiesgoLead(lead({ etapa: 'contrato_firmado', proyectoId: null }), AHORA)
  assert.equal(firmado?.nivel, 'critico', 'firma sin proyecto es crítico')
  assert.equal(firmado?.regla, 'lead_contrato_sin_proyecto', 'dispara la regla 2')
  assert.equal(
    evaluarRiesgoLead(lead({ etapa: 'contrato_firmado', proyectoId: 'proj-1' }), AHORA),
    null,
    'firma con proyecto no es riesgo',
  )

  // --- evaluarRiesgoLead: regla 3, nuevo sin contacto ------------------------
  const nuevo = evaluarRiesgoLead(
    lead({ etapa: 'nuevo_lead', createdAt: horasAtras(24), updatedAt: horasAtras(24) }),
    AHORA,
  )
  assert.equal(nuevo?.nivel, 'atencion', '24 h sin contacto es atención, no crítico')
  assert.equal(nuevo?.regla, 'lead_nuevo_sin_contacto_horas', 'dispara la regla 3')

  // --- no falsos positivos en etapas sanas ------------------------------------
  assert.equal(evaluarRiesgoLead(lead({ etapa: 'contactado' }), AHORA), null, 'contactado no es riesgo')
  assert.equal(evaluarRiesgoLead(lead({ etapa: 'asesoria_agendada' }), AHORA), null, 'asesoría agendada no es riesgo')
  assert.equal(evaluarRiesgoLead(lead({ etapa: 'descartado' }), AHORA), null, 'descartado ya no se monitorea')

  // --- datos sucios no rompen -----------------------------------------------
  assert.equal(evaluarRiesgoLead(lead({ etapa: 'cotizado', updatedAt: 'no-fecha' }), AHORA), null, 'fecha inválida no inventa riesgo')
  assert.equal(evaluarRiesgoLead(lead({ etapa: 'inventada' }), AHORA), null, 'etapa desconocida se ignora')
  // Marca en el futuro → 0 h, nunca negativo ni NaN.
  assert.equal(evaluarRiesgoLead(lead({ etapa: 'cotizado', updatedAt: horasAtras(-50) }), AHORA), null, 'marca futura no dispara')

  // --- umbrales configurables -------------------------------------------------
  const holgado = evaluarRiesgoLead(lead({ etapa: 'cotizado', updatedAt: horasAtras(49) }), AHORA, {
    ...UMBRALES_RIESGO_LEAD,
    cotizadoSilencioHoras: 72,
  })
  assert.equal(holgado, null, 'subir el umbral silencia la regla')

  console.log('OK lib/modules/comercial/leads.test.ts')
}

run()