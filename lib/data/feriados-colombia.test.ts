/**
 * feriados-colombia.test.ts — ejecutar con `npx tsx lib/data/feriados-colombia.test.ts`
 *
 * Este módulo decide una FECHA CONTRACTUAL (la Fecha Máxima de Entrega, de la que depende la
 * retención de mora). Si el calendario de hábiles está mal, la fecha impresa está mal y es
 * disputa. Este archivo fija el comportamiento: si alguien toca un festivo o el algoritmo,
 * el test se pone rojo y hay que ir a ver por qué.
 */
import assert from 'node:assert/strict'
import {
  domingosDePascua,
  feriadosDe,
  pistaCorpusChristi,
  TRASLADOS_LEY_EMILIANI,
  type TrasladosAnio,
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

function mas(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000)
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ── 1. Computus: el Domingo de Resurrección contra fechas conocidas ──────────

test('computus: Domingo de Resurrección 2024-2028', () => {
  const esperado: Record<string, string> = {
    '2024': '2024-03-31',
    '2025': '2025-04-20',
    '2026': '2026-04-05',
    '2027': '2027-03-28',
    '2028': '2028-04-16',
  }
  for (const [anio, esperadoIso] of Object.entries(esperado)) {
    const got = iso(domingosDePascua(Number(anio)))
    assert.equal(got, esperadoIso, `Pascua ${anio}: se esperaba ${esperadoIso} y salio ${got}`)
  }
})

test('computus: la Pascua siempre cae en domingo', () => {
  for (let anio = 2000; anio <= 2100; anio++) {
    assert.equal(
      domingosDePascua(anio).getUTCDay(),
      0,
      `Pascua ${anio} no cae en domingo`,
    )
  }
})

test('computus: 2030 y 2038, los dos años donde el algoritmo se rompe', () => {
  assert.equal(iso(domingosDePascua(2030)), '2030-04-21')
  assert.equal(iso(domingosDePascua(2038)), '2038-04-25')
})

// ── 2. Feriados calculables: fijos + familia de Semana Santa ───────────────

test('fijos: los que nunca se trasladan estan siempre', () => {
  const { fechas } = feriadosDe(2026)
  for (const f of ['2026-01-01', '2026-05-01', '2026-07-20', '2026-08-07', '2026-12-08', '2026-12-25']) {
    assert.ok(fechas.includes(f), `falta el festivo fijo ${f}`)
  }
})

test('Semana Santa 2026: los tresOffsets desde el 5 de abril', () => {
  const { fechas } = feriadosDe(2026)
  for (const f of [
    '2026-02-16', // lunes de carnaval
    '2026-04-02', // jueves santo
    '2026-04-03', // viernes santo
  ]) {
    assert.ok(fechas.includes(f), `falta ${f} en 2026`)
  }
  // Ascensión NO es festivo en Colombia. Si algún día aparece aquí, el conteo de hábiles
  // se va para largo y la fecha máxima sale más lejos de la real.
  assert.ok(!fechas.includes('2026-05-14'), 'la Ascensión no debe ser festivo en Colombia')
  // Corpus Christi SÍ es festivo, pero se traslada al lunes: su jueves no es día festivo y su
  // fecha legal sale de la tabla, no del computus.
  assert.ok(!fechas.includes('2026-06-04'), 'el jueves de Corpus Christi no es el festivo legal')
  assert.equal(iso(pistaCorpusChristi(2026)), '2026-06-04', 'la pista de Corpus Christi es el +60')
})

test('Semana Santa 2027: offsets desde el 28 de marzo', () => {
  const { fechas } = feriadosDe(2027)
  for (const f of [
    '2027-02-08', // lunes de carnaval
    '2027-03-25', // jueves santo
    '2027-03-26', // viernes santo
  ]) {
    assert.ok(fechas.includes(f), `falta ${f} en 2027`)
  }
})

test('cada dia de la familia de Semana Santa cae en su dia de la semana', () => {
  // Solo los tres que NO se trasladan. Ascensión no es festivo; Corpus Christi sí lo es pero
  // su día legal lo fija la tabla, asi que acá se comprueba unicamente que la PISTA caiga en
  // jueves (que es de donde sale el lunes que la Ley Emiliani le asigna).
  const casos: Array<[number, string, number]> = [
    [-48, 'lunes de carnaval', 1],
    [-3, 'jueves santo', 4],
    [-2, 'viernes santo', 5],
  ]
  for (const anio of [2025, 2026, 2027, 2028]) {
    const pascua = domingosDePascua(anio)
    for (const [offset, nombre, esperado] of casos) {
      assert.equal(
        mas(pascua, offset).getUTCDay(),
        esperado,
        `${nombre} ${anio}: dia de la semana inesperado`,
      )
    }
    assert.equal(
      pistaCorpusChristi(anio).getUTCDay(),
      4,
      `corpus christi ${anio}: la pista deberia caer en jueves`,
    )
  }
})

// ── 3. Modo fail-closed: un año sin tabla verificada no sirve para un contrato ──

test('un año sin tabla devuelve verificado:false y lista lo que falta', () => {
  const f = feriadosDe(2099)
  assert.equal(f.verificado, false, 'un año sin registro no puede estar verificado')
  assert.equal(f.fuente, null)
  assert.equal(f.pendientes.length, 8, 'debe listar los 8 traslados por confirmar')
})

test('la tabla de traslados se entrega vacia', () => {
  // Si este test falla, alguien cargo traslados. Eso esta bien SIEMPRE que el ano haya
  // quedado verificado contra el calendario oficial, con su fuente, y con los 8 traslados.
  for (const t of TRASLADOS_LEY_EMILIANI as readonly TrasladosAnio[]) {
    assert.equal(t.verificado, true, `el ano ${t.anio} esta cargado pero NO verificado`)
    assert.ok(t.fuente, `el ano ${t.anio} esta verificado pero sin fuente`)
    assert.equal(t.fechas.length, 8, `el ano ${t.anio} debe traer los 8 traslados resueltos`)
  }
})

// ── 4. Las fechas de la tabla se aplican tal cual ───────────────────────────

test('la tabla manda: sus fechas se aplican sin moverlas', () => {
  const anio = 2098
  const restaurar = conTabla(anio, ['2098-01-06', '2098-01-13', '2098-03-19'])
  try {
    const { fechas, verificado } = feriadosDe(anio)
    for (const f of ['2098-01-06', '2098-01-13', '2098-03-19']) {
      assert.ok(fechas.includes(f), `la tabla dijo ${f} y no se respetó`)
    }
    assert.equal(verificado, true)
  } finally {
    restaurar()
  }
})

test('un festivo trasladado DEJA de ser festivo en su fecha original', () => {
  // Este es el error que motivó reescribir el módulo. Si el 6 de enero aparece en la tabla
  // como traslado a otro día, el 6 de enero DEJO de ser festivo: dejarlo seria contar un
  // festivo de más y alejar la fecha máxima de entrega de la real.
  const anio = 2097
  const original = `${anio}-01-06`
  const nuevo = iso(mas(new Date(`${original}T00:00:00Z`), 7))
  conTabla(anio, [nuevo])
  const { fechas } = feriadosDe(anio)
  assert.ok(fechas.includes(nuevo), 'el dia traslado debe ser festivo')
  assert.ok(!fechas.includes(original), 'el festivo trasladado NO debe quedar en su fecha original')
})

test('un traslado que cae sobre un festivo ya ocupado NO se mueve solo', () => {
  // La tabla entrega fechas FINALES del calendario oficial. Si el código las "arreglara"
  // moviéndolas, un error de tipeo en la tabla se convertiría en otro error, distinto y
  // silencioso. Lo que hay que hacer es corregir la tabla.
  const anio = 2096
  const anioCarnaval = 2096
  const lunesDeCarnaval = mas(domingosDePascua(anioCarnaval), -48)
  assert.equal(lunesDeCarnaval.getUTCDay(), 1, 'el lunes de carnaval debe ser lunes')
  conTabla(anio, [iso(lunesDeCarnaval)])
  const { fechas } = feriadosDe(anio)
  assert.ok(fechas.includes(iso(lunesDeCarnaval)), 'la tabla debe respetarse aunque choque')
})

/** Inyecta un año de prueba en la tabla y devuelve la función para deshacerlo. */
function conTabla(anio: number, fechas: string[]): () => void {
  const tabla = TRASLADOS_LEY_EMILIANI as unknown as TrasladosAnio[]
  const largoOriginal = tabla.length
  tabla.push({ anio, verificado: true, fuente: 'prueba unitaria', fechas })
  return () => {
    tabla.length = largoOriginal
  }
}

// ── 5. Contrato de la forma de la salida ───────────────────────────────────

test('la salida son fechas ISO ordenadas, sin repetir y del ano pedido', () => {
  for (const anio of [2025, 2026, 2027, 2028]) {
    const { fechas } = feriadosDe(anio)
    for (const f of fechas) {
      assert.match(f, /^\d{4}-\d{2}-\d{2}$/, `formato invalido: ${f}`)
      assert.ok(f.startsWith(String(anio)), `${f} no pertenece a ${anio}`)
    }
    assert.equal(new Set(fechas).size, fechas.length, `${anio}: hay fechas repetidas`)
    assert.deepEqual(fechas, [...fechas].sort(), `${anio}: la lista no viene ordenada`)
  }
})

test('sin tabla cargada salen 9: los 6 fijos mas los 3 de Semana Santa', () => {
  // 6 inmoviles + lunes de carnaval + jueves santo + viernes santo. Ni mas ni menos: todo lo
  // demas depende de la tabla anual, y este numero es el que delata un festivo de mas o de
  // menos en la base calculable.
  for (const anio of [2025, 2026, 2027, 2028]) {
    assert.equal(
      feriadosDe(anio).fechas.length,
      9,
      `${anio}: se esperaban exactamente 9 festivos calculables sin traslados`,
    )
  }
})

test('el 19 de julio NO es festivo en Colombia', () => {
  // Nunca lo fue: es una confusion con el 29 de junio (San Pedro y San Pablo), que ademas se
  // traslada. Contarlo como festivo da un dia habil de menos por ano.
  for (const anio of [2025, 2026, 2027]) {
    assert.ok(
      !feriadosDe(anio).fechas.includes(`${anio}-07-19`),
      `${anio}: el 19 de julio no debe ser festivo`,
    )
  }
})

console.log(
  fallos === 0 ? '\nferiados-colombia.test.ts — todo en verde' : `\n${fallos} FALLA(S)`,
)
if (fallos > 0) process.exit(1)
