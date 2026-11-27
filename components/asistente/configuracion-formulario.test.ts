import assert from 'node:assert/strict'
import { aCuerpo, coincide, erroresFormulario, FORMULARIO_VACIO, type FormularioConfiguracion, type ModeloLista } from './configuracion-formulario'

const MODELO: ModeloLista = { id: 'proveedor/modelo', nombre: 'Modelo Prueba', gratis: false, precioPor1MEntradaUsd: 0.5, precioPor1MSalidaUsd: 1.5, contexto: 128000 }
const COMPLETO: FormularioConfiguracion = {
  proveedor: 'openrouter',
  modelo: 'proveedor/modelo',
  temperatura: '0.2',
  maxTokensRespuesta: '1024',
  pasosMaximos: '8',
  topeDiarioUsuarioUsd: '5',
  topeDiarioGlobalUsd: '50',
  alertaFraccion: '0.8',
  herramientasHabilitadas: ['cotizacion.buscar'],
}

const casos: Array<[string, () => void]> = [
  ['formulario completo y modelo del catálogo: sin errores', () => {
    assert.deepEqual(erroresFormulario(COMPLETO, [MODELO]), [])
  }],
  ['sin modelo elegido: pide elegir uno', () => {
    assert.deepEqual(erroresFormulario({ ...COMPLETO, modelo: '' }, [MODELO]), ['Elige un modelo de la lista'])
  }],
  ['modelo que no está en el catálogo cargado: mismo mensaje que el servidor', () => {
    assert.deepEqual(erroresFormulario({ ...COMPLETO, modelo: 'otro/x' }, [MODELO]), ['Modelo no disponible para este proveedor'])
  }],
  ['catálogo aún no cargado: el modelo no se puede validar', () => {
    assert.deepEqual(erroresFormulario(COMPLETO, null), ['Modelo no disponible para este proveedor'])
  }],
  ['cada selector vacío o con valor fuera de lista es un error', () => {
    const errores = erroresFormulario({ ...COMPLETO, temperatura: '', pasosMaximos: '5', alertaFraccion: '0.7' }, [MODELO])
    assert.deepEqual(errores, ['Elige la temperatura', 'Elige los pasos máximos', 'Elige la alerta'])
  }],
  ['tope global menor que el de usuario: error exacto del servidor', () => {
    const errores = erroresFormulario({ ...COMPLETO, topeDiarioUsuarioUsd: '25', topeDiarioGlobalUsd: '10' }, [MODELO])
    assert.deepEqual(errores, ['El tope global no puede ser menor que el tope por usuario'])
  }],
  ['formulario vacío: todos los errores de selección', () => {
    const errores = erroresFormulario(FORMULARIO_VACIO, [MODELO])
    assert.equal(errores.length, 7)
  }],
  ['cuerpo de guardado: números reales y solo campos del esquema', () => {
    const cuerpo = aCuerpo(COMPLETO)
    assert.deepEqual(Object.keys(cuerpo).sort(), [
      'alertaFraccion', 'herramientasHabilitadas', 'maxTokensRespuesta', 'modelo', 'pasosMaximos', 'proveedor',
      'temperatura', 'topeDiarioGlobalUsd', 'topeDiarioUsuarioUsd',
    ])
    assert.equal(cuerpo.temperatura, 0.2)
    assert.equal(cuerpo.alertaFraccion, 0.8)
  }],
  ['búsqueda de modelos: ignora mayúsculas y tildes, y busca por id', () => {
    assert.equal(coincide(MODELO, 'MODELO prueba'), true)
    assert.equal(coincide({ ...MODELO, nombre: 'Qwén Grande' }, 'qwen'), true)
    assert.equal(coincide(MODELO, 'proveedor/mo'), true)
    assert.equal(coincide(MODELO, 'inexistente'), false)
    assert.equal(coincide(MODELO, ''), true)
  }],
]

let fallos = 0
for (const [nombre, fn] of casos) {
  try {
    fn()
    console.log(`ok - ${nombre}`)
  } catch (err) {
    fallos++
    console.error(`FALLA - ${nombre}\n${(err as Error).stack ?? err}`)
  }
}
if (fallos > 0) process.exitCode = 1
