/**
 * contrato-fechas.test.ts — ejecutar con `npx tsx lib/data/contrato-fechas.test.ts`
 *
 * Estas funciones producen la Fecha Máxima de Entrega, que es contractual. Un error aquí se
 * traduce en una fecha impresa que se puede impugnar, así que los casos límite van fijos.
 */
import assert from 'node:assert/strict'
import {
  aISO,
  calcularVentanaEntrega,
  esHabil,
  parsearISO,
  sumarHabiles,
  textoPlazoSemanas,
} from './contrato-fechas'
import {
  FESTIVOS_TRASLADADOS,
  TRASLADOS_LEY_EMILIANI,
  feriadosDe,
} from './feriados-colombia'

let fallos = 0

function test(nombre: string, fn: () => void) {
  try {
    fn()
    console.log(`  ok  ${nombre}`)
  } catch (e) {
    fallos++
    console.error(`  FALLA  ${nombre}`)
    console.error(`        ${(e as Error).message}`)
  }
}

const ANIO_SIN_VERIFICAR = 2099 // la tabla de traslados se entrega vacía, este año no sirve

/** Forma mínima que el test necesita para inyectar un año de prueba. */
interface TrasladosInyectados {
  anio: number
  verificado: boolean
  fuente: string | null
  fechas: string[]
}

/**
 * Feriados de un año cualquiera, aunque no esté verificado: para probar la aritmética.
 * NO se llama `feriadosDe` a propósito, para no sombrear el import y recursionar.
 */
function setDeFeriados(anio: number): Set<string> {
  return new Set(feriadosDe(anio).fechas)
}

function d(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

// ── 1. parseo de fechas ────────────────────────────────────────────────────

test('parsearISO acepta AAAA-MM-DD y rechaza lo que no es fecha', () => {
  assert.equal(aISO(parsearISO('2026-10-15') as Date), '2026-10-15')
  assert.equal(parsearISO('2026-13-01'), null, 'mes 13 no existe')
  assert.equal(parsearISO('2026-02-31'), null, '31 de febrero no existe')
  assert.equal(parsearISO('15/10/2026'), null, 'otro formato')
  assert.equal(parsearISO(''), null)
  assert.equal(parsearISO(null), null)
  assert.equal(parsearISO(undefined), null)
})

// ── 2. dia habil ───────────────────────────────────────────────────────────

test('los fines de semana no son habiles', () => {
  const f = setDeFeriados(2026)
  // 2026-10-17 sabado, 2026-10-18 domingo
  assert.equal(esHabil(d('2026-10-17'), f), false)
  assert.equal(esHabil(d('2026-10-18'), f), false)
  // 2026-10-16 viernes
  assert.equal(esHabil(d('2026-10-16'), f), true)
})

test('un festivo de dia habil deja de ser habil', () => {
  const f = setDeFeriados(2026)
  // Solo se usan INMOVIBLES para esta prueba. 2026-10-12 (Día de la Raza) servía antes, y este
  // test se puso rojo cuando se descubrió que sí se traslada: si el día hábil se calcula sobre
  // un festivo trasladable, el resultado depende de la tabla del año y el test miente.
  for (const iso of ['2026-07-20', '2026-08-07', '2026-12-08']) {
    const dia = d(iso)
    assert.ok(dia.getUTCDay() >= 1 && dia.getUTCDay() <= 5, `${iso} deberia ser dia habil`)
    assert.equal(esHabil(dia, f), false, `${iso} deberia ser festivo`)
  }
})

// ── 3. sumarHabiles ────────────────────────────────────────────────────────

test('sumarHabiles cuenta solo de lunes a viernes', () => {
  const vacio = new Set<string>()
  // 2026-10-14 es miercoles. +5 habiles -> miercoles 2026-10-21
  assert.equal(aISO(sumarHabiles(d('2026-10-14'), 5, vacio) as Date), '2026-10-21')
  // +0 no se mueve
  assert.equal(aISO(sumarHabiles(d('2026-10-14'), 0, vacio) as Date), '2026-10-14')
})

test('sumarHabiles salta el fin de semana', () => {
  const vacio = new Set<string>()
  // viernes 2026-10-16 + 1 habil -> lunes 2026-10-19
  assert.equal(aISO(sumarHabiles(d('2026-10-16'), 1, vacio) as Date), '2026-10-19')
  // lunes 2026-10-19 + 5 habiles -> lunes 2026-10-26
  assert.equal(aISO(sumarHabiles(d('2026-10-19'), 5, vacio) as Date), '2026-10-26')
})

test('sumarHabiles salta los festivos', () => {
  const f = setDeFeriados(2026)
  // 2026-10-13 es martes. +1 habil saltando el Dia de la Raza (lunes 12) y el finde
  // -> miercoles 2026-10-14
  assert.equal(aISO(sumarHabiles(d('2026-10-13'), 1, f) as Date), '2026-10-14')
  // +4 habiles desde el 13 con el 12 festivo: 14, 15, 16, 19 -> lunes 19
  assert.equal(aISO(sumarHabiles(d('2026-10-13'), 4, f) as Date), '2026-10-19')
})

test('sumarHabiles salta la Semana Santa', () => {
  const f = setDeFeriados(2027)
  // 2027-03-24 es miercoles. 25 y 26 son jueves y viernes santos.
  // +1 habil -> lunes 2027-03-29
  assert.equal(aISO(sumarHabiles(d('2027-03-24'), 1, f) as Date), '2027-03-29')
  // +2 habiles -> martes 2027-03-30
  assert.equal(aISO(sumarHabiles(d('2027-03-24'), 2, f) as Date), '2027-03-30')
})

test('sumarHabiles rechaza entradas invalidas en vez de devolver una fecha inventada', () => {
  const vacio = new Set<string>()
  assert.equal(sumarHabiles(d('2026-01-05'), -1, vacio), null, 'negativo')
  assert.equal(sumarHabiles(d('2026-01-05'), 1.5, vacio), null, 'decimal')
  assert.equal(sumarHabiles(d('2026-01-05'), Number.NaN, vacio), null, 'NaN')
  assert.equal(sumarHabiles(new Date('no-es-fecha'), 3, vacio), null, 'fecha invalida')
})

test('cuatro semanas habiles son siempre veinte dias de calendario o mas', () => {
  const vacio = new Set<string>()
  const inicio = d('2026-01-05')
  const salida = sumarHabiles(inicio, 20, vacio) as Date
  const dias = (salida.getTime() - inicio.getTime()) / 86_400_000
  assert.ok(dias >= 28, `20 dias habiles no pueden caber en ${dias} dias de calendario`)
})

// ── 4. calcularVentanaEntrega ──────────────────────────────────────────────

test('sin fecha de firma no hay ventana, y lo dice por que', () => {
  const r = calcularVentanaEntrega({ fechaFirma: null, plazoSemanas: 7, holguraDias: 8 })
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.motivo, 'sin_fecha_firma')
})

test('sin plazo numerico no hay ventana (es el caso que la columna defaults historica rompia)', () => {
  const r = calcularVentanaEntrega({ fechaFirma: '2026-01-05', plazoSemanas: null, holguraDias: 8 })
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.motivo, 'sin_plazo')
})

test('un ano sin festivos verificados NO produce fecha maxima', () => {
  // Este es el fail-closed: se prefiere no imprimir fecha antes que imprimir una erronea.
  const r = calcularVentanaEntrega({
    fechaFirma: `${ANIO_SIN_VERIFICAR}-03-02`,
    plazoSemanas: 8,
    holguraDias: 8,
  })
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.motivo, 'feriados_sin_verificar')
})

test('con el calendario verificado, la ventana se arma y la holgura se suma despues', () => {
  // Inyecta un ano verificado para poder probar la aritmetica completa.
  const tabla = TRASLADOS_LEY_EMILIANI as unknown as TrasladosInyectados[]
  const original = tabla.length
  try {
    // Los traslados quedan sin cargar a proposito (deben confirmarse contra el calendario
    // oficial), asi que aqui se inyectan solo para poder ejercitar el camino feliz del calculo.
    // Los que no tienen fecha de calendario (Corpus Christi) se skipped: van por `desdePascua`.
    const fechas: string[] = []
    for (const f of FESTIVOS_TRASLADADOS) {
      if (f.mes === null || f.dia === null) continue
      const base = new Date(Date.UTC(2026, f.mes - 1, f.dia))
      const dow = base.getUTCDay()
      const dias = dow === 1 ? 7 : (8 - dow) % 7
      fechas.push(aISO(new Date(base.getTime() + dias * 86_400_000)))
    }
    tabla.push({ anio: 2026, verificado: true, fuente: 'prueba unitaria', fechas })

    const r = calcularVentanaEntrega({ fechaFirma: '2026-03-02', plazoSemanas: 8, holguraDias: 8 })
    assert.equal(r.ok, true, 'con el calendario verificado la ventana debe calcularse')
    if (r.ok) {
      // 8 semanas habiles = 40 habiles; la ventana debe estar 40 habiles despues.
      assert.equal(r.ventana.diasHabilesRecorridos, 48)
      assert.match(r.ventana.minima, /^2026-/)
      assert.match(r.ventana.maxima, /^2026-/)
      assert.ok(r.ventana.maxima >= r.ventana.minima, 'la maxima no puede ser anterior a la minima')
      // Y el tramo de holgura debe medir exactamente 8 habiles.
      const soloHolgura = sumarHabiles(
        d(r.ventana.minima),
        8,
        new Set(feriadosDe(2026).fechas),
      )
      assert.equal(aISO(soloHolgura as Date), r.ventana.maxima)
    }
  } finally {
    tabla.length = original
  }
})

test('holgura 0 deja la maxima igual a la minima', () => {
  const tabla = TRASLADOS_LEY_EMILIANI as unknown as TrasladosInyectados[]
  const original = tabla.length
  try {
    tabla.push({ anio: 2026, verificado: true, fuente: 'prueba unitaria', fechas: [] })
    const r = calcularVentanaEntrega({ fechaFirma: '2026-03-02', plazoSemanas: 4, holguraDias: 0 })
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.ventana.maxima, r.ventana.minima)
  } finally {
    tabla.length = original
  }
})

test('holgura negativa o no entera se rechaza', () => {
  const tabla = TRASLADOS_LEY_EMILIANI as unknown as TrasladosInyectados[]
  const original = tabla.length
  try {
    tabla.push({ anio: 2026, verificado: true, fuente: 'prueba unitaria', fechas: [] })
    assert.equal(calcularVentanaEntrega({ fechaFirma: '2026-03-02', plazoSemanas: 4, holguraDias: -1 }).ok, false)
    assert.equal(calcularVentanaEntrega({ fechaFirma: '2026-03-02', plazoSemanas: 4, holguraDias: 2.5 }).ok, false)
  } finally {
    tabla.length = original
  }
})

// ── 5. texto del plazo ─────────────────────────────────────────────────────

// ── 6. Contratos que cruzan el año ─────────────────────────────────────────

/** Inyecta un año verificado con los traslados de ejemplo, y devuelve el restaurador. */
function anioVerificado(anio: number): () => void {
  const tabla = TRASLADOS_LEY_EMILIANI as unknown as TrasladosInyectados[]
  const largo = tabla.length
  const fechas: string[] = []
  for (const f of FESTIVOS_TRASLADADOS) {
    if (f.mes === null || f.dia === null) continue
    const base = new Date(Date.UTC(anio, f.mes - 1, f.dia))
    const dow = base.getUTCDay()
    const dias = dow === 1 ? 7 : (8 - dow) % 7
    fechas.push(aISO(new Date(base.getTime() + dias * 86_400_000)))
  }
  tabla.push({ anio, verificado: true, fuente: 'prueba unitaria', fechas })
  return () => {
    tabla.length = largo
  }
}

test('un contrato de diciembre usa los festivos del año siguiente', () => {
  // Firmado el 1 de diciembre, 7 semanas + 8 días hábiles de holgura: la fecha máxima cae en
  // enero. Si solo se mirara el calendario del año de firma, la ventana saldría demasiado corta
  // y la fecha máxima impresa sería anterior a la real.
  const restaurar = anioVerificado(2026)
  const restaurar2 = anioVerificado(2027)
  try {
    const r = calcularVentanaEntrega({ fechaFirma: '2026-12-01', plazoSemanas: 7, holguraDias: 8 })
    assert.equal(r.ok, true, 'con los dos años verificados la ventana debe calcularse')
    if (r.ok) {
      // 7 semanas hábiles = 35 hábiles, y desde el 1 de diciembre eso cae en enero: la ventana
      // COMPLETA cruza la frontera del año, no solo la holgura.
      assert.ok(
        r.ventana.minima > '2026-12-31',
        `la minima deberia caer en 2027, no en ${r.ventana.minima}`,
      )
      assert.equal(r.ventana.diasHabilesRecorridos, 43, '35 de plazo + 8 de holgura')

      // La prueba de fondo: el 1 de enero de 2027 es festivo, así que la ventana tiene que
      // saltearlo. Si solo se usara el calendario de 2026, la maxima caeria un dia habil antes.
      const sinSalto = sumarHabiles(new Date('2026-12-01T00:00:00Z'), 43, new Set())
      assert.ok(sinSalto, 'la cuenta sin festivos deberia dar una fecha')
      if (sinSalto) {
        const conSalto = aISO(sinSalto)
        assert.ok(
          r.ventana.maxima !== conSalto,
          `la maxima (${r.ventana.maxima}) es igual a la cuenta sin festivos (${conSalto}): el calendario de 2027 no se esta usando`,
        )
      }
    }
  } finally {
    // En orden INVERSO al de inserción: los restauradores hacen `tabla.length = largo`, y
    // restores en orden directo dejan un hueco (undefined) en el array, que después revienta
    // el `.find()` de `feriadosDe`.
    restaurar2()
    restaurar()
  }
})

test('si el año siguiente NO está verificado, tampoco hay fecha máxima', () => {
  // Es la mitad del fail-closed: un calendario verificado a medias no sirve. Con diciembre
  // verificado y enero sin verificar, la fecha máxima caería en un mes cuyo calendario se
  // está suponiendo — mejor no imprimirla.
  const restaurar = anioVerificado(2026)
  try {
    const r = calcularVentanaEntrega({ fechaFirma: '2026-12-01', plazoSemanas: 7, holguraDias: 8 })
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.motivo, 'feriados_sin_verificar')
  } finally {
    restaurar()
  }
})

test('un contrato de enero NO necesita el calendario de diciembre', () => {
  // El caso inverso, que también estaba roto cuando se exigía "el año siguiente" siempre:
  // exigir el año completo siguiente dejaba sin fecha máxima a todos los contratos de enero,
  // que no lo necesitan para nada.
  const restaurar = anioVerificado(2026)
  try {
    const r = calcularVentanaEntrega({ fechaFirma: '2026-01-05', plazoSemanas: 7, holguraDias: 8 })
    assert.equal(r.ok, true, 'un contrato de enero no deberia depender del año siguiente')
    if (r.ok) {
      assert.ok(r.ventana.maxima < '2026-12-31', 'la ventana de enero no deberia llegar a diciembre')
    }
  } finally {
    restaurar()
  }
})

test('el plazo se imprime en semanas habiles, nunca en meses', () => {
  assert.equal(textoPlazoSemanas(8), '8 semanas hábiles')
  assert.equal(textoPlazoSemanas(1), '1 semana hábil')
  assert.equal(textoPlazoSemanas(0), null)
  assert.equal(textoPlazoSemanas(null), null)
  assert.equal(textoPlazoSemanas(2.5), null)
})

console.log(
  fallos === 0 ? '\ncontrato-fechas.test.ts — todo en verde' : `\n${fallos} FALLA(S)`,
)
if (fallos > 0) process.exit(1)
