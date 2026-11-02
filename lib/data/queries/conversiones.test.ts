import assert from 'node:assert/strict'
import {
  construirFilasConversion,
  filtrarConversiones,
  calcularKpis,
  listarCampanas,
} from './conversiones'
import type {
  Cliente,
  Contrato,
  EventoConversionOffline,
  Lead,
  Proyecto,
} from '../contracts'

function lead(over: Partial<Lead> & { id: string }): Lead {
  return {
    nombre: '',
    telefonoWhatsapp: null,
    email: null,
    gclid: null,
    wbraid: null,
    gbraid: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    hashedPhone: null,
    hashedEmail: null,
    tipoProyecto: 'Asesoría Base',
    ubicacion: 'Bogotá',
    scoreConversion: 0,
    etapa: 'nuevo_lead',
    proyectoId: null,
    clienteId: null,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    ...over,
  }
}

const cliente = (id: string, nombre: string): Cliente => ({
  id,
  nombre,
  documento: null,
  telefono: null,
  email: null,
  domicilio: null,
})

const proyecto = (id: string, codigo: string, clienteId: string | null): Proyecto =>
  ({ id, codigo, clienteId } as unknown as Proyecto)

const contrato = (id: string, proyectoId: string, valorTotal: string): Contrato =>
  ({ id, proyectoId, codigoContrato: `C-${id}`, valorTotal } as unknown as Contrato)

const evento = (
  id: string,
  leadId: string,
  estadoEnvio: EventoConversionOffline['estadoEnvio']
): EventoConversionOffline =>
  ({ id, leadId, estadoEnvio } as unknown as EventoConversionOffline)

const leads: Lead[] = [
  lead({
    id: 'aaaa1111-0000-0000-0000-000000000001',
    nombre: 'Carlos Mendoza',
    telefonoWhatsapp: '+573001234567',
    gclid: 'GCLID-1',
    utmCampaign: 'Cocinas_Bogota',
    utmTerm: 'cocina integral',
    clienteId: 'c1',
    proyectoId: 'p1',
    etapa: 'contrato_firmado',
  }),
  lead({
    id: 'bbbb2222-0000-0000-0000-000000000002',
    nombre: 'Cliente Web',
    telefonoWhatsapp: '+573009998877',
    utmCampaign: 'Cocinas_Bogota',
    createdAt: '2026-10-25T15:00:00.000Z',
  }),
  lead({ id: 'cccc3333-0000-0000-0000-000000000003' }),
]

const filas = construirFilasConversion({
  leads,
  clientes: [cliente('c1', 'Carlos Mendoza')],
  proyectos: [proyecto('p1', 'COT-2026-10-20-001', 'c1')],
  contratos: [contrato('k1', 'p1', '12500000')],
  eventos: [evento('e1', leads[0].id, 'pendiente'), evento('e2', leads[0].id, 'enviado_exitoso')],
})

// Cruce lead -> cliente/proyecto/contrato
assert.equal(filas[0].nombre, 'Carlos Mendoza')
assert.equal(filas[0].clienteNombre, 'Carlos Mendoza')
assert.equal(filas[0].proyectoCodigo, 'COT-2026-10-20-001')
assert.equal(filas[0].contratoCodigo, 'C-k1')
assert.equal(filas[0].valorContrato, 12500000)
assert.equal(filas[0].atribuido, true)
assert.equal(filas[0].canal, 'google_ads')
assert.equal(filas[0].ref, 'VD-AAAA1111')
assert.equal(filas[0].eventosPendientes, 1)
assert.equal(filas[0].sinIdentificar, false)

// "Cliente Web" es placeholder: se muestra como sin nombre, pero el teléfono lo identifica.
assert.equal(filas[1].nombre, null)
assert.equal(filas[1].sinIdentificar, false)
assert.equal(filas[1].atribuido, false)

// Lead sin nombre ni teléfono: clic sin identificar.
assert.equal(filas[2].sinIdentificar, true)
assert.equal(filas[2].atribuido, false)
assert.equal(filas[2].canal, 'organico')

// KPIs
const kpis = calcularKpis(filas)
assert.equal(kpis.total, 3)
assert.equal(kpis.atribuidas, 1)
assert.equal(kpis.sinAtribucion, 2)
assert.equal(kpis.sinIdentificar, 1)
assert.equal(kpis.conCliente, 1)
assert.equal(kpis.contratos, 1)
assert.equal(kpis.valorContratos, 12500000)
assert.equal(kpis.eventosPendientes, 1)

// Filtros
assert.equal(filtrarConversiones(filas, {}).length, 3)
assert.equal(filtrarConversiones(filas, { atribucion: 'ads' }).length, 1)
assert.equal(filtrarConversiones(filas, { atribucion: 'sin_ads' }).length, 2)
assert.equal(filtrarConversiones(filas, { vinculo: 'con_cliente' }).length, 1)
assert.equal(filtrarConversiones(filas, { vinculo: 'sin_cliente' }).length, 2)
assert.equal(filtrarConversiones(filas, { campana: 'Cocinas_Bogota' }).length, 2)
assert.equal(filtrarConversiones(filas, { etapa: 'contrato_firmado' }).length, 1)
assert.equal(filtrarConversiones(filas, { desde: '2026-10-25' }).length, 1)
assert.equal(filtrarConversiones(filas, { hasta: '2026-10-20' }).length, 2)
assert.equal(filtrarConversiones(filas, { busqueda: '300123' }).length, 1)
assert.equal(filtrarConversiones(filas, { busqueda: 'VD-CCCC' }).length, 1)
assert.equal(filtrarConversiones(filas, { busqueda: 'no-existe' }).length, 0)

assert.deepEqual(listarCampanas(filas), ['Cocinas_Bogota'])

console.log('conversiones.test.ts OK')
