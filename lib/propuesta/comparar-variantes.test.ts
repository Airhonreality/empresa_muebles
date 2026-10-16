import assert from 'node:assert/strict'

import { compararVariantes, type AcabadoDeEspacio } from './comparar-variantes'
import type { CatalogoAcabado, EspacioVariante, ItemVariante } from '../data/contracts'

const TARIFAS = { tarifaDev: 100000, tarifaAssembly: 80000, tarifaInstall: 90000 }

function espacio(over: Partial<EspacioVariante> & { id: string }): EspacioVariante {
  return {
    proyectoId: 'p1',
    nombreEspacio: 'Cocina',
    nombreVariante: 'Inicial',
    tipoEspacio: 'cocina',
    descripcion: null,
    activa: false,
    visibleEnPropuestaPublica: true,
    orden: 0,
    jornadasDesarrolloTecnico: '0',
    jornadasEnsamblajeTaller: '0',
    jornadasInstalacionObra: '0',
    fotosEspacio: [],
    fotosDisenio: [],
    fotosReferencia: [],
    ...over,
  }
}

function item(over: Partial<ItemVariante> & { id: string; varianteId: string }): ItemVariante {
  return {
    catalogoId: null,
    nombrePersonalizado: null,
    cantidad: '1',
    precioUnitario: '0',
    totalLinea: '0',
    anulado: false,
    esReferencial: false,
    fuenteReferencial: null,
    grupoReferencial: null,
    comentario: null,
    grupoItemId: null,
    fotoUrl: null,
    marca: null,
    referencia: null,
    color: null,
    dimensiones: null,
    acabado: null,
    espesor: null,
    camposPersonalizados: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...over,
  }
}

function acabado(over: Partial<CatalogoAcabado> & { id: string; nombre: string }): CatalogoAcabado {
  return {
    familia: null,
    color: null,
    colorHex: '#000000',
    textura: null,
    precioDiferencial: null,
    imagenTexturaUrl: null,
    marca: null,
    ...over,
  }
}

// 1. Superlleno: todas las dimensiones presentes y con diferencias reales.
{
  const base = espacio({ id: 'base', activa: true, descripcion: 'Diseño en L', nombreVariante: 'Inicial' })
  const alt = espacio({
    id: 'alt',
    descripcion: 'Diseño en isla',
    nombreVariante: 'Premium',
    fotosDisenio: ['a.jpg', 'b.jpg'],
    fotosEspacio: ['x.jpg'],
    jornadasEnsamblajeTaller: '1',
  })
  const acabadosBase: AcabadoDeEspacio[] = [
    { descripcionUso: 'fachadas', acabado: acabado({ id: 'ac1', nombre: 'Roble mate' }) },
    { descripcionUso: 'mesón', acabado: acabado({ id: 'ac2', nombre: 'Granito negro' }) },
  ]
  const acabadosAlt: AcabadoDeEspacio[] = [
    { descripcionUso: 'fachadas', acabado: acabado({ id: 'ac1', nombre: 'Roble mate' }) },
    { descripcionUso: 'mesón de isla', acabado: acabado({ id: 'ac2', nombre: 'Granito negro' }) },
    { descripcionUso: 'rodapié', acabado: acabado({ id: 'ac3', nombre: 'Aluminio' }) },
  ]
  const items = [
    item({ id: 'b1', varianteId: 'base', catalogoId: 'cat1', cantidad: '2', precioUnitario: '500000', totalLinea: '1000000' }),
    item({ id: 'b2', varianteId: 'base', catalogoId: 'cat2', precioUnitario: '300000', totalLinea: '300000', marca: 'A' }),
    item({ id: 'a1', varianteId: 'alt', catalogoId: 'cat1', cantidad: '2', precioUnitario: '500000', totalLinea: '1000000' }),
    item({ id: 'a2', varianteId: 'alt', catalogoId: 'cat2', precioUnitario: '300000', totalLinea: '300000', marca: 'B' }),
    item({ id: 'a3', varianteId: 'alt', nombrePersonalizado: 'Iluminación LED', precioUnitario: '200000', totalLinea: '200000' }),
  ]
  const catalogoPorId = { cat1: { descripcion: 'Módulo' }, cat2: { descripcion: 'Puerta' } }
  const diff = compararVariantes({
    a: base,
    b: alt,
    items,
    grupos: [],
    acabadosPorEspacio: { base: acabadosBase, alt: acabadosAlt },
    catalogoPorId,
    tarifas: TARIFAS,
  })

  assert.equal(diff.dimensiones.descripcion.presente, true)
  assert.equal(diff.dimensiones.descripcion.igual, false)
  assert.equal(diff.dimensiones.acabados.presente, true)
  assert.equal(diff.dimensiones.acabados.detalle.cambian.length, 1, 'destino del mesón cambia')
  assert.equal(diff.dimensiones.acabados.detalle.exclusivos.length, 1, 'rodapié solo en alt')
  assert.equal(diff.dimensiones.acabados.detalle.comunes, 1)
  assert.equal(diff.dimensiones.fotos.presente, true)
  assert.equal(diff.dimensiones.fotos.detalle.totalSoloB, 3)
  assert.equal(diff.dimensiones.items.detalle.cambian.length, 1, 'cat2 cambia marca')
  assert.equal(diff.dimensiones.items.detalle.soloB.length, 1, 'iluminación solo en alt')
  assert.equal(diff.dimensiones.items.detalle.comunes, 1)
  assert.equal(diff.dimensiones.items.detalle.cambian[0].atributosCambiados[0].etiqueta, 'Marca')
  assert.equal(diff.dimensiones.jornadas.presente, true)
  assert.equal(diff.dimensiones.jornadas.detalle.deltaCOP, 80000, '+1 jornada ensamblaje')
  assert.equal(diff.sinDiferencias, false)
  assert.equal(diff.a.esContractual, true)
  assert.equal(diff.b.esContractual, false)
}

// 2. Superescaso: solo ítems. Ninguna dimensión fantasma.
{
  const base = espacio({ id: 'base', activa: true })
  const alt = espacio({ id: 'alt', nombreVariante: 'Opción 2' })
  const items = [
    item({ id: 'b1', varianteId: 'base', nombrePersonalizado: 'Mueble A', precioUnitario: '100' }),
    item({ id: 'a1', varianteId: 'alt', nombrePersonalizado: 'Mueble A', precioUnitario: '100' }),
    item({ id: 'a2', varianteId: 'alt', nombrePersonalizado: 'Mueble B', precioUnitario: '200' }),
  ]
  const diff = compararVariantes({
    a: base,
    b: alt,
    items,
    grupos: [],
    acabadosPorEspacio: {},
    catalogoPorId: {},
    tarifas: TARIFAS,
  })
  assert.equal(diff.dimensiones.descripcion.presente, false)
  assert.equal(diff.dimensiones.acabados.presente, false)
  assert.equal(diff.dimensiones.fotos.presente, false)
  assert.equal(diff.dimensiones.jornadas.presente, false)
  assert.equal(diff.dimensiones.grupos.presente, false)
  assert.equal(diff.dimensiones.items.presente, true)
  assert.equal(diff.dimensiones.items.detalle.soloB.length, 1)
  assert.equal(diff.dimensiones.items.detalle.comunes, 1)
  assert.equal(diff.notas.length, 0)
}

// 3. Idénticas: sin diferencias explícitas.
{
  const base = espacio({ id: 'base', activa: true, descripcion: 'Igual', jornadasEnsamblajeTaller: '2' })
  const alt = espacio({ id: 'alt', descripcion: 'Igual', jornadasEnsamblajeTaller: '2' })
  const items = [
    item({ id: 'b1', varianteId: 'base', catalogoId: 'cat1', precioUnitario: '100', totalLinea: '100' }),
    item({ id: 'a1', varianteId: 'alt', catalogoId: 'cat1', precioUnitario: '100', totalLinea: '100' }),
  ]
  const diff = compararVariantes({
    a: base,
    b: alt,
    items,
    grupos: [],
    acabadosPorEspacio: {},
    catalogoPorId: { cat1: { descripcion: 'Módulo' } },
    tarifas: TARIFAS,
  })
  assert.equal(diff.sinDiferencias, true)
  assert.equal(diff.deltaTotal, 0)
  assert.equal(diff.dimensiones.items.detalle.comunes, 1)
}

// 4. Duplicados de catálogo: se emparejan por índice, no se cuentan como exclusivos.
{
  const base = espacio({ id: 'base', activa: true })
  const alt = espacio({ id: 'alt' })
  const items = [
    item({ id: 'b1', varianteId: 'base', catalogoId: 'cat1', cantidad: '1', precioUnitario: '100' }),
    item({ id: 'b2', varianteId: 'base', catalogoId: 'cat1', cantidad: '1', precioUnitario: '100' }),
    item({ id: 'a1', varianteId: 'alt', catalogoId: 'cat1', cantidad: '3', precioUnitario: '100' }),
    item({ id: 'a2', varianteId: 'alt', catalogoId: 'cat1', cantidad: '1', precioUnitario: '100' }),
  ]
  const diff = compararVariantes({
    a: base,
    b: alt,
    items,
    grupos: [],
    acabadosPorEspacio: {},
    catalogoPorId: { cat1: { descripcion: 'Módulo' } },
    tarifas: TARIFAS,
  })
  assert.equal(diff.dimensiones.items.detalle.soloA.length, 0)
  assert.equal(diff.dimensiones.items.detalle.soloB.length, 0)
  assert.equal(diff.dimensiones.items.detalle.cambian.length, 1, 'una cantidad cambia')
  assert.equal(diff.dimensiones.items.detalle.comunes, 1)
}

// 5. Ambas vacías: nada que mostrar, cero notas.
{
  const base = espacio({ id: 'base', activa: true })
  const alt = espacio({ id: 'alt' })
  const diff = compararVariantes({
    a: base,
    b: alt,
    items: [],
    grupos: [],
    acabadosPorEspacio: {},
    catalogoPorId: {},
    tarifas: TARIFAS,
  })
  assert.equal(diff.sinDiferencias, true)
  assert.deepEqual(
    Object.values(diff.dimensiones).map((d) => d.presente),
    [false, false, false, false, false, false, false],
  )
  assert.equal(diff.notas.length, 0)
}

// 6. Asimetría de completitud: nota neutra, no se lee como diferencia comercial.
{
  const base = espacio({ id: 'base', activa: true, descripcion: 'Con texto' })
  const alt = espacio({ id: 'alt' })
  const diff = compararVariantes({
    a: base,
    b: alt,
    items: [],
    grupos: [],
    acabadosPorEspacio: {},
    catalogoPorId: {},
    tarifas: TARIFAS,
  })
  assert.ok(diff.notas.some((n) => n.includes('descripción')))
  assert.ok(diff.dimensiones.descripcion.presente)
  assert.equal(diff.dimensiones.descripcion.igual, false)
  assert.equal(diff.dimensiones.descripcion.resumen, 'Solo una versión registra descripción.')
}

console.log('comparar-variantes.test.ts OK')
