import type { EspacioVariante, ItemVariante, GrupoItem, CatalogoAcabado } from '../data/contracts'

export type EstadoPieza = 'igual' | 'cambia' | 'soloA' | 'soloB'

export interface PerfilCompletitud {
  tieneDescripcion: boolean
  tieneAcabados: boolean
  tieneFotos: boolean
  tieneItems: boolean
  tieneJornadas: boolean
  tieneReferenciales: boolean
  tieneGrupos: boolean
}

export interface ResumenVersion {
  id: string
  nombreEspacio: string
  nombreVariante: string
  esContractual: boolean
  total: number
  totalMateriales: number
  totalManoObra: number
  perfil: PerfilCompletitud
}

export interface AtributoItemComparado {
  etiqueta: string
  valorA: string | null
  valorB: string | null
}

export interface ItemComparado {
  estado: EstadoPieza
  nombre: string
  confianzaBaja: boolean
  cantidadA: number
  cantidadB: number
  precioA: number
  precioB: number
  deltaPrecio: number
  grupoA: string | null
  grupoB: string | null
  atributosCambiados: AtributoItemComparado[]
}

export interface AcabadoComparado {
  estado: EstadoPieza
  nombreA: string | null
  nombreB: string | null
  acabadoA: CatalogoAcabado | null
  acabadoB: CatalogoAcabado | null
  destinoA: string | null
  destinoB: string | null
  destinoCambia: boolean
}

export interface JornadaComparada {
  clave: 'dev' | 'ens' | 'inst'
  etiqueta: string
  a: number
  b: number
  delta: number
  deltaCOP: number
}

export interface FotoGrupoComparado {
  etiqueta: string
  comunes: number
  soloA: string[]
  soloB: string[]
}

export interface DetalleDescripcion {
  textoA: string | null
  textoB: string | null
}

export interface DetalleAcabados {
  cambian: AcabadoComparado[]
  exclusivos: AcabadoComparado[]
  comunes: number
}

export interface DetalleFotos {
  porTipo: FotoGrupoComparado[]
  totalSoloA: number
  totalSoloB: number
  totalComunes: number
}

export interface DetalleJornadas {
  filas: JornadaComparada[]
  deltaCOP: number
}

export interface DetalleItems {
  cambian: ItemComparado[]
  soloA: ItemComparado[]
  soloB: ItemComparado[]
  comunes: number
}

export interface DetalleGrupos {
  soloA: string[]
  soloB: string[]
}

export interface Dimension<T> {
  presente: boolean
  igual: boolean
  resumen: string
  detalle: T
}

export interface DiffEspacio {
  a: ResumenVersion
  b: ResumenVersion
  deltaTotal: number
  deltaTotalPct: number | null
  sinDiferencias: boolean
  notas: string[]
  dimensiones: {
    descripcion: Dimension<DetalleDescripcion>
    acabados: Dimension<DetalleAcabados>
    fotos: Dimension<DetalleFotos>
    jornadas: Dimension<DetalleJornadas>
    items: Dimension<DetalleItems>
    referenciales: Dimension<DetalleItems>
    grupos: Dimension<DetalleGrupos>
  }
}

export interface AcabadoDeEspacio {
  descripcionUso: string
  acabado: CatalogoAcabado
}

export interface ArgsComparar {
  a: EspacioVariante
  b: EspacioVariante
  items: ItemVariante[]
  grupos: GrupoItem[]
  acabadosPorEspacio: Record<string, AcabadoDeEspacio[]>
  catalogoPorId: Record<string, { descripcion: string } | undefined>
  tarifas: { tarifaDev: number; tarifaAssembly: number; tarifaInstall: number }
}

function normalizar(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function parseNum(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function textoONull(s: string | null | undefined): string | null {
  const t = (s ?? '').trim()
  return t.length > 0 ? t : null
}

function nombreItem(item: ItemVariante, catalogoPorId: ArgsComparar['catalogoPorId']): string {
  return (
    textoONull(item.nombrePersonalizado) ??
    (item.catalogoId ? textoONull(catalogoPorId[item.catalogoId]?.descripcion) : null) ??
    'Ítem'
  )
}

function claveItem(item: ItemVariante, catalogoPorId: ArgsComparar['catalogoPorId']): string {
  return item.catalogoId ? `c:${item.catalogoId}` : `n:${normalizar(nombreItem(item, catalogoPorId))}`
}

function itemsDe(items: ItemVariante[], varianteId: string, referencial: boolean): ItemVariante[] {
  return items.filter((it) => it.varianteId === varianteId && !it.anulado && it.esReferencial === referencial)
}

function manoDeObraDe(esp: EspacioVariante, tarifas: ArgsComparar['tarifas']): number {
  return (
    parseNum(esp.jornadasDesarrolloTecnico) * tarifas.tarifaDev +
    parseNum(esp.jornadasEnsamblajeTaller) * tarifas.tarifaAssembly +
    parseNum(esp.jornadasInstalacionObra) * tarifas.tarifaInstall
  )
}

function materialesDe(items: ItemVariante[]): number {
  return items.reduce((s, it) => s + parseNum(it.totalLinea), 0)
}

function agruparPor<T>(lista: T[], clave: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const it of lista) {
    const k = clave(it)
    const arr = m.get(k) ?? []
    arr.push(it)
    m.set(k, arr)
  }
  return m
}

function emparejar<T>(
  mapA: Map<string, T[]>,
  mapB: Map<string, T[]>,
): { pares: Array<[T, T]>; soloA: T[]; soloB: T[] } {
  const pares: Array<[T, T]> = []
  const soloA: T[] = []
  const soloB: T[] = []
  const claves = new Set<string>([...mapA.keys(), ...mapB.keys()])
  for (const k of claves) {
    const listaA = mapA.get(k) ?? []
    const listaB = mapB.get(k) ?? []
    const n = Math.min(listaA.length, listaB.length)
    for (let i = 0; i < n; i++) pares.push([listaA[i], listaB[i]])
    for (let i = n; i < listaA.length; i++) soloA.push(listaA[i])
    for (let i = n; i < listaB.length; i++) soloB.push(listaB[i])
  }
  return { pares, soloA, soloB }
}

function camposPersonalizadosDe(item: ItemVariante | undefined): Map<string, { etiqueta: string; valor: string }> {
  const m = new Map<string, { etiqueta: string; valor: string }>()
  for (const c of item?.camposPersonalizados ?? []) {
    const etiqueta = textoONull(c.clave)
    if (etiqueta) m.set(normalizar(etiqueta), { etiqueta, valor: c.valor })
  }
  return m
}

const CAMPOS_UNIVERSALES: Array<[string, keyof ItemVariante]> = [
  ['Marca', 'marca'],
  ['Referencia', 'referencia'],
  ['Color', 'color'],
  ['Dimensiones', 'dimensiones'],
  ['Acabado', 'acabado'],
  ['Espesor', 'espesor'],
]

function atributosCambiados(itemA: ItemVariante, itemB: ItemVariante): AtributoItemComparado[] {
  const salida: AtributoItemComparado[] = []
  for (const [etiqueta, campo] of CAMPOS_UNIVERSALES) {
    const va = textoONull(itemA[campo] as string | null)
    const vb = textoONull(itemB[campo] as string | null)
    if (normalizar(va) !== normalizar(vb)) salida.push({ etiqueta, valorA: va, valorB: vb })
  }
  const camposA = camposPersonalizadosDe(itemA)
  const camposB = camposPersonalizadosDe(itemB)
  const claves = new Set<string>([...camposA.keys(), ...camposB.keys()])
  for (const k of claves) {
    const ca = camposA.get(k)
    const cb = camposB.get(k)
    if (normalizar(ca?.valor) !== normalizar(cb?.valor)) {
      salida.push({ etiqueta: ca?.etiqueta ?? cb?.etiqueta ?? k, valorA: textoONull(ca?.valor), valorB: textoONull(cb?.valor) })
    }
  }
  return salida
}

function nombreGrupoDe(item: ItemVariante, gruposPorId: Map<string, GrupoItem>): string | null {
  const g = item.grupoItemId ? gruposPorId.get(item.grupoItemId) : undefined
  return g ? g.nombre : null
}

function itemComparadoDe(
  estado: EstadoPieza,
  itemA: ItemVariante | undefined,
  itemB: ItemVariante | undefined,
  catalogoPorId: ArgsComparar['catalogoPorId'],
  gruposPorId: Map<string, GrupoItem>,
): ItemComparado {
  const base = itemA ?? itemB!
  const grupoA = itemA ? nombreGrupoDe(itemA, gruposPorId) : null
  const grupoB = itemB ? nombreGrupoDe(itemB, gruposPorId) : null
  const atributos = itemA && itemB ? atributosCambiados(itemA, itemB) : []
  if (itemA && itemB && normalizar(grupoA) !== normalizar(grupoB)) {
    atributos.push({ etiqueta: 'Grupo', valorA: grupoA, valorB: grupoB })
  }
  const precioA = itemA ? parseNum(itemA.precioUnitario) : 0
  const precioB = itemB ? parseNum(itemB.precioUnitario) : 0
  return {
    estado,
    nombre: nombreItem(base, catalogoPorId),
    confianzaBaja: !base.catalogoId,
    cantidadA: itemA ? parseNum(itemA.cantidad) : 0,
    cantidadB: itemB ? parseNum(itemB.cantidad) : 0,
    precioA,
    precioB,
    deltaPrecio: precioB - precioA,
    grupoA,
    grupoB,
    atributosCambiados: atributos,
  }
}

function construirItems(
  itemsA: ItemVariante[],
  itemsB: ItemVariante[],
  catalogoPorId: ArgsComparar['catalogoPorId'],
  gruposPorId: Map<string, GrupoItem>,
): DetalleItems {
  const mapA = agruparPor(itemsA, (it) => claveItem(it, catalogoPorId))
  const mapB = agruparPor(itemsB, (it) => claveItem(it, catalogoPorId))
  const { pares, soloA, soloB } = emparejar(mapA, mapB)

  const cambian: ItemComparado[] = []
  let comunes = 0
  for (const [ia, ib] of pares) {
    const atributos = atributosCambiados(ia, ib)
    const cantidadCambia = parseNum(ia.cantidad) !== parseNum(ib.cantidad)
    const precioCambia = parseNum(ia.precioUnitario) !== parseNum(ib.precioUnitario)
    if (atributos.length === 0 && !cantidadCambia && !precioCambia) {
      comunes++
    } else {
      cambian.push(itemComparadoDe('cambia', ia, ib, catalogoPorId, gruposPorId))
    }
  }

  const ordenar = (arr: ItemComparado[]) => arr.slice().sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'))

  return {
    cambian: ordenar(cambian),
    soloA: ordenar(soloA.map((it) => itemComparadoDe('soloA', it, undefined, catalogoPorId, gruposPorId))),
    soloB: ordenar(soloB.map((it) => itemComparadoDe('soloB', undefined, it, catalogoPorId, gruposPorId))),
    comunes,
  }
}

function detalleAcabados(
  listaA: AcabadoDeEspacio[],
  listaB: AcabadoDeEspacio[],
): DetalleAcabados {
  const clave = (x: AcabadoDeEspacio) => `${normalizar(x.acabado.nombre)}|${normalizar(x.acabado.marca)}`
  const { pares, soloA, soloB } = emparejar(agruparPor(listaA, clave), agruparPor(listaB, clave))

  const cambian: AcabadoComparado[] = []
  let comunes = 0
  for (const [x, y] of pares) {
    const destinoCambia = normalizar(x.descripcionUso) !== normalizar(y.descripcionUso)
    const fila: AcabadoComparado = {
      estado: destinoCambia ? 'cambia' : 'igual',
      nombreA: x.acabado.nombre,
      nombreB: y.acabado.nombre,
      acabadoA: x.acabado,
      acabadoB: y.acabado,
      destinoA: textoONull(x.descripcionUso),
      destinoB: textoONull(y.descripcionUso),
      destinoCambia,
    }
    if (destinoCambia) cambian.push(fila)
    else comunes++
  }

  const exclusivo = (x: AcabadoDeEspacio, estado: 'soloA' | 'soloB'): AcabadoComparado => ({
    estado,
    nombreA: estado === 'soloA' ? x.acabado.nombre : null,
    nombreB: estado === 'soloB' ? x.acabado.nombre : null,
    acabadoA: estado === 'soloA' ? x.acabado : null,
    acabadoB: estado === 'soloB' ? x.acabado : null,
    destinoA: estado === 'soloA' ? textoONull(x.descripcionUso) : null,
    destinoB: estado === 'soloB' ? textoONull(x.descripcionUso) : null,
    destinoCambia: false,
  })

  return {
    cambian,
    exclusivos: [
      ...soloA.map((x) => exclusivo(x, 'soloA')),
      ...soloB.map((x) => exclusivo(x, 'soloB')),
    ],
    comunes,
  }
}

const TIPOS_FOTO: Array<{ etiqueta: string; campo: 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia' }> = [
  { etiqueta: 'Espacio actual', campo: 'fotosEspacio' },
  { etiqueta: 'Diseño', campo: 'fotosDisenio' },
  { etiqueta: 'Referencia', campo: 'fotosReferencia' },
]

function detalleFotos(a: EspacioVariante, b: EspacioVariante): DetalleFotos {
  const porTipo: FotoGrupoComparado[] = []
  let totalSoloA = 0
  let totalSoloB = 0
  let totalComunes = 0
  for (const tipo of TIPOS_FOTO) {
    const setA = new Set((a[tipo.campo] ?? []).filter(Boolean) as string[])
    const setB = new Set((b[tipo.campo] ?? []).filter(Boolean) as string[])
    if (setA.size === 0 && setB.size === 0) continue
    const soloA = [...setA].filter((u) => !setB.has(u))
    const soloB = [...setB].filter((u) => !setA.has(u))
    const comunes = [...setA].filter((u) => setB.has(u)).length
    totalSoloA += soloA.length
    totalSoloB += soloB.length
    totalComunes += comunes
    porTipo.push({ etiqueta: tipo.etiqueta, comunes, soloA, soloB })
  }
  return { porTipo, totalSoloA, totalSoloB, totalComunes }
}

function detalleJornadas(a: EspacioVariante, b: EspacioVariante, tarifas: ArgsComparar['tarifas']): DetalleJornadas {
  const defs: Array<[JornadaComparada['clave'], string, string, number]> = [
    ['dev', 'Desarrollo técnico', 'jornadasDesarrolloTecnico', tarifas.tarifaDev],
    ['ens', 'Ensamblaje', 'jornadasEnsamblajeTaller', tarifas.tarifaAssembly],
    ['inst', 'Instalación', 'jornadasInstalacionObra', tarifas.tarifaInstall],
  ]
  const filas: JornadaComparada[] = defs.map(([clave, etiqueta, campo, tarifa]) => {
    const va = parseNum((a as unknown as Record<string, string>)[campo])
    const vb = parseNum((b as unknown as Record<string, string>)[campo])
    const delta = vb - va
    return { clave, etiqueta, a: va, b: vb, delta, deltaCOP: delta * tarifa }
  })
  return { filas, deltaCOP: filas.reduce((s, f) => s + f.deltaCOP, 0) }
}

function perfilDe(
  esp: EspacioVariante,
  items: ItemVariante[],
  grupos: GrupoItem[],
  acabadosPorEspacio: ArgsComparar['acabadosPorEspacio'],
): PerfilCompletitud {
  const contractuales = itemsDe(items, esp.id, false)
  const tieneFotos =
    (esp.fotosEspacio ?? []).some(Boolean) ||
    (esp.fotosDisenio ?? []).some(Boolean) ||
    (esp.fotosReferencia ?? []).some(Boolean)
  return {
    tieneDescripcion: textoONull(esp.descripcion) !== null,
    tieneAcabados: (acabadosPorEspacio[esp.id]?.length ?? 0) > 0,
    tieneFotos,
    tieneItems: contractuales.length > 0,
    tieneJornadas:
      parseNum(esp.jornadasDesarrolloTecnico) > 0 ||
      parseNum(esp.jornadasEnsamblajeTaller) > 0 ||
      parseNum(esp.jornadasInstalacionObra) > 0,
    tieneReferenciales: itemsDe(items, esp.id, true).length > 0,
    tieneGrupos: grupos.some((g) => g.espacioVarianteId === esp.id),
  }
}

function resumenDe(
  esp: EspacioVariante,
  items: ItemVariante[],
  grupos: GrupoItem[],
  acabadosPorEspacio: ArgsComparar['acabadosPorEspacio'],
  tarifas: ArgsComparar['tarifas'],
): ResumenVersion {
  const contractuales = itemsDe(items, esp.id, false)
  const totalMateriales = materialesDe(contractuales)
  const totalManoObra = manoDeObraDe(esp, tarifas)
  return {
    id: esp.id,
    nombreEspacio: esp.nombreEspacio,
    nombreVariante: esp.nombreVariante,
    esContractual: esp.activa,
    total: totalMateriales + totalManoObra,
    totalMateriales,
    totalManoObra,
    perfil: perfilDe(esp, items, grupos, acabadosPorEspacio),
  }
}

export function compararVariantes(args: ArgsComparar): DiffEspacio {
  const { a, b, items, grupos, acabadosPorEspacio, catalogoPorId, tarifas } = args
  const gruposPorId = new Map(grupos.map((g) => [g.id, g]))

  const resumenA = resumenDe(a, items, grupos, acabadosPorEspacio, tarifas)
  const resumenB = resumenDe(b, items, grupos, acabadosPorEspacio, tarifas)
  const deltaTotal = resumenB.total - resumenA.total
  const deltaTotalPct = resumenA.total > 0 ? Math.round((deltaTotal / resumenA.total) * 1000) / 10 : null

  const textoA = textoONull(a.descripcion)
  const textoB = textoONull(b.descripcion)
  const descripcionIgual = normalizar(textoA) === normalizar(textoB)
  const descripcion: Dimension<DetalleDescripcion> = {
    presente: textoA !== null || textoB !== null,
    igual: descripcionIgual,
    resumen: descripcionIgual
      ? 'La descripción es la misma.'
      : textoA === null || textoB === null
        ? 'Solo una versión registra descripción.'
        : 'La descripción cambia.',
    detalle: { textoA, textoB },
  }

  const listaAcabadosA = acabadosPorEspacio[a.id] ?? []
  const listaAcabadosB = acabadosPorEspacio[b.id] ?? []
  const detAcabados = detalleAcabados(listaAcabadosA, listaAcabadosB)
  const acabadosIgual = detAcabados.cambian.length === 0 && detAcabados.exclusivos.length === 0
  const totalAcabados = detAcabados.cambian.length + detAcabados.exclusivos.length + detAcabados.comunes
  const acabados: Dimension<DetalleAcabados> = {
    presente: listaAcabadosA.length > 0 || listaAcabadosB.length > 0,
    igual: acabadosIgual,
    resumen: acabadosIgual
      ? 'Los materiales y acabados son los mismos.'
      : [
          detAcabados.cambian.length > 0 ? `${detAcabados.cambian.length} de ${totalAcabados} cambian` : null,
          detAcabados.exclusivos.length > 0 ? `${detAcabados.exclusivos.length} solo en una versión` : null,
        ]
          .filter(Boolean)
          .join(' · ') + '.',
    detalle: detAcabados,
  }

  const detFotos = detalleFotos(a, b)
  const fotosIgual = detFotos.totalSoloA === 0 && detFotos.totalSoloB === 0
  const fotos: Dimension<DetalleFotos> = {
    presente: detFotos.porTipo.length > 0,
    igual: fotosIgual,
    resumen: fotosIgual ? 'El material visual es el mismo.' : 'El material visual cambia.',
    detalle: detFotos,
  }

  const detJornadas = detalleJornadas(a, b, tarifas)
  const jornadasIgual = detJornadas.filas.every((f) => f.delta === 0)
  const jornadas: Dimension<DetalleJornadas> = {
    presente: resumenA.perfil.tieneJornadas || resumenB.perfil.tieneJornadas,
    igual: jornadasIgual,
    resumen: jornadasIgual
      ? 'La mano de obra no cambia.'
      : `La mano de obra ${detJornadas.deltaCOP > 0 ? 'aumenta' : 'disminuye'}.`,
    detalle: detJornadas,
  }

  const detItems = construirItems(
    itemsDe(items, a.id, false),
    itemsDe(items, b.id, false),
    catalogoPorId,
    gruposPorId,
  )
  const itemsIgual = detItems.cambian.length === 0 && detItems.soloA.length === 0 && detItems.soloB.length === 0
  const itemsDim: Dimension<DetalleItems> = {
    presente: resumenA.perfil.tieneItems || resumenB.perfil.tieneItems,
    igual: itemsIgual,
    resumen: itemsIgual
      ? 'Los elementos cotizados son los mismos.'
      : [
          detItems.cambian.length > 0 ? `${detItems.cambian.length} cambian` : null,
          detItems.soloA.length > 0 ? `${detItems.soloA.length} solo en una versión` : null,
          detItems.soloB.length > 0 ? `${detItems.soloB.length} solo en la otra` : null,
        ]
          .filter(Boolean)
          .join(' · ') + '.',
    detalle: detItems,
  }

  const detReferenciales = construirItems(
    itemsDe(items, a.id, true),
    itemsDe(items, b.id, true),
    catalogoPorId,
    gruposPorId,
  )
  const refIgual =
    detReferenciales.cambian.length === 0 && detReferenciales.soloA.length === 0 && detReferenciales.soloB.length === 0
  const referenciales: Dimension<DetalleItems> = {
    presente: resumenA.perfil.tieneReferenciales || resumenB.perfil.tieneReferenciales,
    igual: refIgual,
    resumen: refIgual ? 'Las referencias con terceros son las mismas.' : 'Cambian las referencias con terceros.',
    detalle: detReferenciales,
  }

  const nombresGrupoA = [...new Set(grupos.filter((g) => g.espacioVarianteId === a.id).map((g) => g.nombre))]
  const nombresGrupoB = [...new Set(grupos.filter((g) => g.espacioVarianteId === b.id).map((g) => g.nombre))]
  const setGrupoA = new Set(nombresGrupoA.map(normalizar))
  const setGrupoB = new Set(nombresGrupoB.map(normalizar))
  const gruposSoloA = nombresGrupoA.filter((n) => !setGrupoB.has(normalizar(n)))
  const gruposSoloB = nombresGrupoB.filter((n) => !setGrupoA.has(normalizar(n)))
  const gruposIgual = gruposSoloA.length === 0 && gruposSoloB.length === 0
  const gruposDim: Dimension<DetalleGrupos> = {
    presente: nombresGrupoA.length > 0 || nombresGrupoB.length > 0,
    igual: gruposIgual,
    resumen: gruposIgual ? 'La organización de los elementos es la misma.' : 'Cambió la organización de los elementos.',
    detalle: { soloA: gruposSoloA, soloB: gruposSoloB },
  }

  const notas: string[] = []
  if (listaAcabadosA.length > 0 !== listaAcabadosB.length > 0) {
    notas.push('Una versión no tiene materiales y acabados registrados; eso no significa que no los incluya.')
  }
  if ((a.fotosDisenio ?? []).length > 0 !== (b.fotosDisenio ?? []).length > 0) {
    notas.push('El material visual (fotos de diseño) solo está cargado en una de las versiones.')
  }
  if ((textoA !== null) !== (textoB !== null)) {
    notas.push('Solo una de las versiones tiene descripción escrita.')
  }

  const dimensiones = { descripcion, acabados, fotos, jornadas, items: itemsDim, referenciales, grupos: gruposDim }
  const sinDiferencias =
    deltaTotal === 0 &&
    Object.values(dimensiones).every((d) => !d.presente || d.igual)

  return { a: resumenA, b: resumenB, deltaTotal, deltaTotalPct, sinDiferencias, notas, dimensiones }
}

export function dimensionesPresentes(diff: DiffEspacio): Array<{ clave: string; dimension: Dimension<unknown> }> {
  const entradas: Array<[string, Dimension<unknown>]> = [
    ['acabados', diff.dimensiones.acabados],
    ['items', diff.dimensiones.items],
    ['jornadas', diff.dimensiones.jornadas],
    ['descripcion', diff.dimensiones.descripcion],
    ['fotos', diff.dimensiones.fotos],
    ['referenciales', diff.dimensiones.referenciales],
    ['grupos', diff.dimensiones.grupos],
  ]
  return entradas.filter(([, d]) => d.presente).map(([clave, dimension]) => ({ clave, dimension }))
}

export const ETIQUETAS_DIMENSION: Record<string, string> = {
  acabados: 'Materiales y acabados',
  items: 'Qué incluye',
  jornadas: 'Mano de obra',
  descripcion: 'Descripción del diseño',
  fotos: 'Material visual',
  referenciales: 'Referencias con terceros',
  grupos: 'Organización',
}
