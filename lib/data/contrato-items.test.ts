/**
 * t-166: tests de la compilación de la lista de ítems del contrato.
 * Patrón del repo: `node:assert` + `npx tsx`, sin runner (ver AGENTS.md).
 *
 *   npx tsx lib/data/contrato-items.test.ts
 *
 * Estos tests son la red de seguridad de una decisión de negocio: el SKU NO debe aparecer
 * en el contrato, y la ficha técnica SÍ. Si alguien reintroduce el SKU, este archivo falla.
 */

import assert from 'node:assert/strict'
import {
  SECCIONES_ESPECIFICACIONES,
  compilarEspecificaciones,
  compilarObjetoItems,
  compilarFichaItem,
  lineaObjetoItem,
  mapearCategoriaASeccion,
  tieneItemsDeLaCategoria,
} from './contrato-items'
import type { EspacioVariante, ItemVariante, ProductoCatalogo } from './contracts'

// ── Fixtures mínimos ─────────────────────────────────────────────────────────

function producto(over: Partial<ProductoCatalogo> = {}): ProductoCatalogo {
  return {
    id: 'p1',
    sku: 'MADERAS-0001',
    descripcion: 'Tablero de MDP 18mm',
    tipo: 'Madera',
    unidadMedida: 'ud',
    precioDirecto: '100',
    precioPublico: '150',
    stockActual: 10,
    proveedorId: null,
    imagenUrl: null,
    galeriaImagenesUrl: [],
    camposPersonalizados: [],
    fichaTecnicaUrls: [],
    modelo3dUrl: null,
    categoriaComercial: 'Maderas',
    ...over,
  } as ProductoCatalogo
}

function item(over: Partial<ItemVariante> = {}): ItemVariante {
  return {
    id: 'i1',
    varianteId: 'e1',
    catalogoId: null,
    cantidad: '2',
    precioUnitario: '100',
    totalLinea: '200',
    anulado: false,
    nombrePersonalizado: null,
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
    ...over,
  } as ItemVariante
}

function espacio(id = 'e1'): EspacioVariante {
  return { id, nombreEspacio: 'Cocina' } as EspacioVariante
}

// ── SKU fuera del contrato ──────────────────────────────────────────────────

{
  const prod = producto({ sku: 'MADERAS-0001' })
  const linea = lineaObjetoItem(item({ catalogoId: prod.id }), prod)
  assert.ok(
    !linea.includes('MADERAS-0001'),
    `el SKU no debe aparecer en la línea del contrato, salió: ${linea}`,
  )
  assert.ok(!linea.includes('SKU'), `no debe aparecer la palabra "SKU": ${linea}`)
}

{
  // El SKU tampoco puede colarse por la descripción del producto.
  const prod = producto({ descripcion: 'Tablero MDP', sku: 'SECRETO-999' })
  const obj = compilarObjetoItems([espacio()], new Map([['e1', [item({ catalogoId: prod.id })]]]), new Map([[prod.id, prod]]))
  assert.ok(!obj.includes('SECRETO-999'), 'el SKU no debe aparecer en el objeto completo')
}

// ── Ficha técnica en la línea ───────────────────────────────────────────────

{
  const prod = producto()
  const ficha = compilarFichaItem(
    item({ marca: 'Egger', acabado: 'Blanco Mate', espesor: '18 mm', color: 'Blanco' }),
    prod,
  )
  assert.equal(ficha, ' — Marca: Egger, Acabado: Blanco Mate, Espesor: 18 mm, Color: Blanco')
  assert.ok(!ficha.includes('SKU'))
}

{
  // Solo se imprimen los campos que EXISTEN: no hay relleno con "null" ni guiones.
  const ficha = compilarFichaItem(item({ marca: 'Blum' }), undefined)
  assert.equal(ficha, ' — Marca: Blum')
}

{
  const ficha = compilarFichaItem(item({}), undefined)
  assert.equal(ficha, '', 'sin datos de ficha la línea no lleva sufijo')
}

{
  // Campos personalizados del ÍTEM (tienen precedencia sobre los del producto).
  const prod = producto({ camposPersonalizados: [{ clave: 'Módulo elástico', valor: '0.90' }] })
  const ficha = compilarFichaItem(
    item({ marca: 'Egger', camposPersonalizados: [{ clave: 'Número de aperturas', valor: '2' }] }),
    prod,
  )
  assert.ok(ficha.includes('Número de aperturas: 2'), 'usa los personalizados del ítem')
  assert.ok(!ficha.includes('Módulo elástico'), 'no mezcla la ficha del producto si el ítem tiene la suya')
}

{
  // Sin personalizados en el ítem, hereda los del producto de catálogo.
  const prod = producto({ camposPersonalizados: [{ clave: 'Número de aperturas', valor: '60000' }] })
  const ficha = compilarFichaItem(item({ marca: 'Blum' }), prod)
  assert.ok(ficha.includes('Número de aperturas: 60000'), 'hereda la ficha del producto')
}

{
  // Un personalizado sin clave o sin valor no genera un "Clave: null" en el contrato.
  const ficha = compilarFichaItem(
    item({ camposPersonalizados: [{ clave: 'Orilla', valor: 'Sin' }, { clave: '  ', valor: 'x' }, { clave: 'Y', valor: '  ' }] }),
    undefined,
  )
  assert.equal(ficha, ' — Orilla: Sin')
}

{
  // Deduplicación: un personalizado llamado "marca" no se repite junto al universal.
  const ficha = compilarFichaItem(
    item({ marca: 'Egger', camposPersonalizados: [{ clave: ' MARCA ', valor: 'Otro' }] }),
    undefined,
  )
  assert.equal(ficha, ' — Marca: Egger', 'el universal gana y el duplicado se descarta')
}

// ── Formato de la línea ─────────────────────────────────────────────────────

{
  const prod = producto({ unidadMedida: 'panel' })
  assert.equal(
    lineaObjetoItem(item({ catalogoId: prod.id, cantidad: '3', nombrePersonalizado: 'Módulo superior' }), prod),
    '- Módulo superior: 3 panel',
  )
}

{
  // Ítem sin catálogo: se describe por su nombre personalizado y unidad "ud".
  assert.equal(lineaObjetoItem(item({ nombrePersonalizado: 'Instalación en sitio', cantidad: '1' }), undefined), '- Instalación en sitio: 1 ud')
}

{
  assert.equal(lineaObjetoItem(item({}), undefined), '- Ítem sin catálogo: 2 ud')
}

// ── Objeto completo ─────────────────────────────────────────────────────────

{
  const madera = producto({ id: 'pm', descripcion: 'MDP 18mm', categoriaComercial: 'Maderas' })
  const herraje = producto({ id: 'ph', descripcion: 'Bisagra Blum', categoriaComercial: 'Herrajes', unidadMedida: 'pza' })
  const map = new Map([[madera.id, madera], [herraje.id, herraje]])
  const items = new Map<string, ItemVariante[]>([
    ['e1', [item({ id: 'a', catalogoId: 'pm', cantidad: '4', acabado: 'Blanco' }), item({ id: 'b', catalogoId: 'ph', cantidad: '12', marca: 'Blum' })]],
    ['e2', [item({ id: 'c', nombrePersonalizado: 'Instalación', cantidad: '1' })]],
  ])
  const obj = compilarObjetoItems([espacio('e1'), espacio('e2')], items, map)
  assert.equal(
    obj,
    [
      '- MDP 18mm: 4 ud — Acabado: Blanco',
      '- Bisagra Blum: 12 pza — Marca: Blum',
      '- Instalación: 1 ud',
    ].join('\n'),
  )
  assert.ok(!obj.includes('MADERAS-0001') && !obj.includes('MADERAS'))
}

{
  assert.equal(compilarObjetoItems([], new Map(), new Map()), '')
  assert.equal(compilarObjetoItems([espacio()], new Map(), new Map()), '', 'espacio sin ítems no inventa líneas')
}

// ── Secciones de especificaciones ────────────────────────────────────────────

{
  assert.equal(mapearCategoriaASeccion('Maderas'), 'Estructura')
  assert.equal(mapearCategoriaASeccion('Herrajes'), 'Herrajes')
  assert.equal(mapearCategoriaASeccion('Mesones'), null, 'sin categoría equivalente: no se mapea a la fuerza')
  assert.equal(mapearCategoriaASeccion('Mano de Obra'), null)
  assert.equal(mapearCategoriaASeccion(null), null)
  assert.equal(mapearCategoriaASeccion(''), null)
  assert.equal(mapearCategoriaASeccion(undefined), null)
}

{
  const madera = producto({ id: 'pm', categoriaComercial: 'Maderas' })
  const otro = producto({ id: 'px', descripcion: 'Piedra', categoriaComercial: 'Piedras' })
  const map = new Map([[madera.id, madera], [otro.id, otro]])
  const items = new Map<string, ItemVariante[]>([
    ['e1', [item({ id: 'a', catalogoId: 'pm', cantidad: '4', espesor: '18 mm' }), item({ id: 'b', catalogoId: 'px', cantidad: '2' })]],
  ])
  const espacios = [espacio()]

  assert.equal(compilarEspecificaciones(espacios, items, map, 'Estructura'), '- Tablero de MDP 18mm: 4 ud — Espesor: 18 mm')
  assert.equal(compilarEspecificaciones(espacios, items, map, 'Herrajes'), '', 'la piedra no es herraje')
  assert.equal(compilarEspecificaciones(espacios, items, map, 'Mesones'), '', 'sin equivalente, vacío')

  assert.equal(tieneItemsDeLaCategoria(espacios, items, map, 'Estructura'), true)
  assert.equal(tieneItemsDeLaCategoria(espacios, items, map, 'Herrajes'), false)
  assert.equal(tieneItemsDeLaCategoria(espacios, items, map, 'Mesones'), false)
  assert.equal(tieneItemsDeLaCategoria(espacios, items, map, 'Desmonte'), false)
}

{
  // Un ítem sin categoría de catálogo no se publica en ninguna sección.
  const sinCat = producto({ id: 'pz', categoriaComercial: null })
  const map = new Map([[sinCat.id, sinCat]])
  const items = new Map<string, ItemVariante[]>([['e1', [item({ catalogoId: 'pz' })]]])
  for (const s of SECCIONES_ESPECIFICACIONES) {
    assert.equal(tieneItemsDeLaCategoria([espacio()], items, map, s), false, `no debe aparecer en ${s}`)
  }
}

console.log('contrato-items.test.ts — todo en verde')
