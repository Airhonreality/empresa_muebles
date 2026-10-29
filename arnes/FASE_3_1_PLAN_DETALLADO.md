# Fase 3.1: Plan Detallado para Implementación

**Para:** Haiku  
**Commit base:** `6295684` (schema + tipos listos)  
**Token budget:** ~14k  
**Modo:** Implementar secuencialmente, 1 tarea por vez, compilar después de cada una

---

## PARTE A: Tareas sin Bloqueos (Paralelas)

### T5: Queries para Cargar Grupos Hidratados

**Archivo:** `lib/data/actions/lecturas-cotizador.ts`  
**Ubicación:** Al final del archivo, antes de exports

**Código a agregar:**

```typescript
/** Cargar grupo con ítems, subgrupos y contenedor descriptivo.
 * Resultado: árbol completo para UI (colapsable). */
export async function obtenerGrupoItemHidratado(
  grupoId: string,
): Promise<GrupoItemHidratado | null> {
  return db.transaction(async (tx) => {
    const [grupo] = await tx.select().from(s.gruposItem).where(eq(s.gruposItem.id, grupoId))
    if (!grupo) return null

    // Cargar contenedor descriptivo
    const [contenedor] = await tx
      .select()
      .from(s.contenedoresDescriptivos)
      .where(eq(s.contenedoresDescriptivos.grupoItemId, grupoId))

    // Cargar items directos de este grupo
    const items = await tx
      .select()
      .from(s.itemsVariante)
      .where(eq(s.itemsVariante.grupoItemId, grupoId))
      .orderBy(asc(s.itemsVariante.createdAt))

    // Cargar subgrupos recursivamente
    const subgrupos: GrupoItemHidratado[] = []
    const [hijosDirectos] = await tx
      .select()
      .from(s.gruposItem)
      .where(eq(s.gruposItem.padreId, grupoId))
      .orderBy(asc(s.gruposItem.orden))

    for (const hijo of hijosDirectos) {
      const subgrupo = await obtenerGrupoItemHidratado(hijo.id)
      if (subgrupo) subgrupos.push(subgrupo)
    }

    return {
      ...grupo,
      contenedor: contenedor || null,
      items: items as unknown as ItemVariante[],
      subgrupos,
    } as GrupoItemHidratado
  })
}

/** Cargar todos los grupos de un espacio (solo root, sin subgrupos anidados en resultado).
 * Para cotizador: muestra grupos "hermanos" dentro del espacio. */
export async function obtenerGruposItemRootDelEspacio(
  espacioVarianteId: string,
): Promise<GrupoItemHidratado[]> {
  const gruposRoot = await db
    .select()
    .from(s.gruposItem)
    .where(
      and(
        eq(s.gruposItem.espacioVarianteId, espacioVarianteId),
        isNull(s.gruposItem.padreId), // Solo root
      ),
    )
    .orderBy(asc(s.gruposItem.orden))

  const resultado: GrupoItemHidratado[] = []
  for (const grupo of gruposRoot) {
    const hidratado = await obtenerGrupoItemHidratado(grupo.id)
    if (hidratado) resultado.push(hidratado)
  }
  return resultado
}
```

**Imports necesarios** (agregar al top si no existen):
```typescript
import { asc, isNull } from 'drizzle-orm'
import type { GrupoItemHidratado } from '@/lib/data/contracts'
```

**✅ Después de escribir:** `npm run tsc --noEmit` (no debe tener errores nuevos)

---

### T6: Función de Cálculo de Precio Público de Grupo

**Archivo:** Crear nuevo `lib/data/queries/grupo-calculado.ts`

**Contenido completo:**

```typescript
import { num } from '@/lib/utils'
import type { GrupoItemHidratado, GrupoItemCalculado, ItemVariante } from '@/lib/data/contracts'

/** Parámetros financieros de mano de obra (vienen de parametros.ts). */
export interface ParametrosManoObra {
  tasaManoObraDesarrollo: number // $/hora
  tasaManoObraEnsamblaje: number
  tasaManoObraInstalacion: number
  porcentajeIva: number // 0-100 (ej: 19)
}

/** Calcula totales de grupo: suma items + mano de obra + IVA. */
export function calcularGrupoItemCalculado(
  grupo: GrupoItemHidratado,
  parametros: ParametrosManoObra,
): GrupoItemCalculado {
  // 1. Suma de items (neto)
  const sumaItemsNeto = grupo.items.reduce((acc, item) => {
    return acc + num(item.precioUnitario) * num(item.cantidad)
  }, 0)

  // 2. Aplicar IVA
  const tasaIva = parametros.porcentajeIva / 100
  const sumaItemsConIva = sumaItemsNeto * (1 + tasaIva)

  // 3. Mano de obra: jornadas × tasa horaria
  const valorManoObra =
    num(grupo.jornadasDesarrolloTecnico) * parametros.tasaManoObraDesarrollo +
    num(grupo.jornadasEnsamblajeTaller) * parametros.tasaManoObraEnsamblaje +
    num(grupo.jornadasInstalacionObra) * parametros.tasaManoObraInstalacion

  // 4. Total grupo = items con IVA + mano de obra
  const precioPublicoGrupo = sumaItemsConIva + valorManoObra

  return {
    ...grupo,
    sumaItemsNeto: String(sumaItemsNeto.toFixed(2)),
    sumaItemsConIVA: String(sumaItemsConIva.toFixed(2)),
    valorManoObraEstimada: String(valorManoObra.toFixed(2)),
    precioPublicoGrupo: String(precioPublicoGrupo.toFixed(2)),
  } as GrupoItemCalculado
}

/** Calcula precios de subgrupos recursivamente. */
export function calcularGrupoConSubgrupos(
  grupo: GrupoItemHidratado,
  parametros: ParametrosManoObra,
): GrupoItemCalculado {
  const calculado = calcularGrupoItemCalculado(grupo, parametros)
  // Recalcular subgrupos también
  calculado.subgrupos = grupo.subgrupos.map((sub) =>
    calcularGrupoConSubgrupos(sub, parametros),
  )
  return calculado as GrupoItemCalculado
}
```

**Imports necesarios:**
```typescript
import type { GrupoItemHidratado, GrupoItemCalculado } from '@/lib/data/contracts'
```

**Nota:** `num()` ya existe en `lib/utils.ts`, debe estar disponible

**✅ Compilar:** `npm run tsc --noEmit` (debe pasar)

---

### T7: Actualizar Fixtures para Crear Contenedores de Grupos

**Archivo:** `lib/data/fixtures.ts`

**Ubicación:** Encontrar donde se define el array `gruposItem`

**Buscar:** `export const gruposItem = [` (debería estar alrededor de línea 300-400)

**Cambio:** Después de crear los fixtures de grupos, crear sus contenedores

**Código a agregar DESPUÉS de `gruposItem`:**

```typescript
// Contenedores descriptivos para grupos (Fase 3.1, 2026-10-29)
export const contenedoresDescriptivos = [
  // Grupo "Isla Central" del espacio "Cocina principal"
  {
    id: UUID('cond-isla-central'),
    espacioVarianteId: null, // null porque es para grupo
    grupoItemId: UUID('grupo-isla'), // El grupo creado arriba
    descripcion: 'Isla central con cubierta en granito negro, gavetas con frentes en blanco brillante',
    fotosEspacio: [] as string[],
    fotosDisenio: [
      'https://r2.example.com/proyectos/cotizacion/isla-frente.jpg',
      'https://r2.example.com/proyectos/cotizacion/isla-arriba.jpg',
    ],
    fotosReferencia: [
      'https://r2.example.com/catalogos/referencias/isla-granito-1.jpg',
    ],
    createdAt: '2026-10-29T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z',
  },
  // Grupo "Muebles Altos"
  {
    id: UUID('cond-muebles-altos'),
    espacioVarianteId: null,
    grupoItemId: UUID('grupo-altos'),
    descripcion: 'Muebles altos con vidrio templado en puertas',
    fotosEspacio: [],
    fotosDisenio: [],
    fotosReferencia: [],
    createdAt: '2026-10-29T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z',
  },
]

// Contenedores para espacios (traslado de campos legacy de espacioVariantes)
export const contenedoresDescriptivosEspacios = [
  {
    id: UUID('cond-esp-cocina'),
    espacioVarianteId: UUID('esp01'),
    grupoItemId: null,
    descripcion: 'Muebles bajos + altos + isla central',
    fotosEspacio: [] as string[],
    fotosDisenio: [],
    fotosReferencia: [],
    createdAt: '2026-10-29T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z',
  },
  // ... agregar más espacios según existan en fixtures
]

// Contenedores artefactos para espacios (legacy)
export const contenedoresArtefactos = [
  // Estos pueden estar vacíos por ahora, rellenar si había artefactos en espacios
]
```

**Nota:** Reemplaza las URLs de `fotosDisenio` con URLs válidas de tu R2 o déjalas vacías

**✅ Compilar:** `npm run tsc --noEmit` (debe pasar)

---

## PARTE B: Tareas Secuenciales (Bloqueadas por Parte A)

### T1: Componentes de Edición de Grupo en Cotizador

**Archivo:** `app/erp/(modern)/cotizador/[proyectoId]/page.tsx`

**Ubicación:** Encontrar dónde se renderizan los espacios (búsqueda: `espacios.map(`)

**Tarea:** Después del render de ítems del espacio, agregar render de grupos

**Pseudocódigo para la sección:**

```typescript
{/* Renderizar grupos hermanos del espacio */}
{obtenerGruposItemRootDelEspacio(espacio.id).map((grupo) => (
  <GrupoItemEditor
    key={grupo.id}
    grupo={grupo}
    parametros={parametros}
    onUpdate={(cambios) => actualizarGrupoItemAction(grupo.id, cambios)}
    onConvert={() => {
      // Abre modal T2
      setGrupoAConvertir(grupo)
      setAbrirModalConversor(true)
    }}
  />
))}
```

**Crear nuevo componente:** `app/erp/(modern)/cotizador/components/GrupoItemEditor.tsx`

```typescript
'use client'

import type { GrupoItemHidratado, GrupoItemCalculado } from '@/lib/data/contracts'
import { calcularGrupoConSubgrupos, type ParametrosManoObra } from '@/lib/data/queries/grupo-calculado'
import { useState } from 'react'

interface Props {
  grupo: GrupoItemHidratado
  parametros: ParametrosManoObra
  onUpdate: (cambios: Partial<typeof grupo>) => Promise<void>
  onConvert: () => void
}

export function GrupoItemEditor({ grupo, parametros, onUpdate, onConvert }: Props) {
  const [expandido, setExpandido] = useState(false)
  const calculado = calcularGrupoConSubgrupos(grupo, parametros)

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Header colapsable */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandido(!expandido)}>
        <div className="flex-1">
          <h3 className="font-bold">{grupo.nombre}</h3>
          <p className="text-sm text-gray-600">
            {grupo.items.length} ítems · ${calculado.precioPublicoGrupo}
          </p>
        </div>
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
          onClick={(e) => {
            e.stopPropagation()
            onConvert()
          }}
        >
          Convertir a Producto
        </button>
      </div>

      {/* Contenido expandible */}
      {expandido && (
        <div className="mt-4 border-t pt-4">
          {/* Jornadas */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <input
              type="number"
              step="0.5"
              value={grupo.jornadasDesarrolloTecnico}
              onChange={(e) => onUpdate({ jornadasDesarrolloTecnico: e.target.value })}
              placeholder="Jornadas desarrollo"
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="0.5"
              value={grupo.jornadasEnsamblajeTaller}
              onChange={(e) => onUpdate({ jornadasEnsamblajeTaller: e.target.value })}
              placeholder="Jornadas ensamblaje"
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="0.5"
              value={grupo.jornadasInstalacionObra}
              onChange={(e) => onUpdate({ jornadasInstalacionObra: e.target.value })}
              placeholder="Jornadas instalación"
              className="border rounded px-2 py-1 text-sm"
            />
          </div>

          {/* Resumen de cálculos */}
          <div className="bg-gray-100 p-2 rounded text-sm mb-4">
            <p>Neto ítems: ${calculado.sumaItemsNeto}</p>
            <p>Con IVA: ${calculado.sumaItemsConIVA}</p>
            <p>Mano de obra: ${calculado.valorManoObraEstimada}</p>
            <p className="font-bold">Total grupo: ${calculado.precioPublicoGrupo}</p>
          </div>

          {/* Items del grupo */}
          <div className="space-y-2">
            {grupo.items.map((item) => (
              <div key={item.id} className="border-l-2 border-gray-300 pl-2 text-sm">
                <p>{item.nombrePersonalizado || 'Item sin nombre'}</p>
                <p className="text-gray-600">${item.totalLinea || '0'}</p>
              </div>
            ))}
          </div>

          {/* Subgrupos */}
          {grupo.subgrupos.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="font-semibold text-sm mb-2">Subgrupos:</p>
              {grupo.subgrupos.map((sub) => (
                <GrupoItemEditor key={sub.id} grupo={sub} parametros={parametros} onUpdate={onUpdate} onConvert={onConvert} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

**✅ Compilar:** `npm run tsc --noEmit`

---

### T2: Modal "Convertir Grupo a Producto"

**Archivo:** Crear `app/erp/(modern)/cotizador/components/ConvertirGrupoAProductoModal.tsx`

```typescript
'use client'

import type { GrupoItemCalculado } from '@/lib/data/contracts'
import { convertirGrupoAProductoAction } from '@/lib/data/actions/core'
import { useState } from 'react'

interface Props {
  grupo: GrupoItemCalculado | null
  abierto: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ConvertirGrupoAProductoModal({ grupo, abierto, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState(grupo?.nombre || '')
  const [categoria, setCategoria] = useState('')
  const [cargando, setCargando] = useState(false)

  if (!abierto || !grupo) return null

  const handleConvertir = async () => {
    if (!nombre.trim()) {
      alert('Ingresa nombre del producto')
      return
    }

    setCargando(true)
    try {
      await convertirGrupoAProductoAction(grupo.id, {
        nombreProducto: nombre,
        descripcion: grupo.contenedor?.descripcion,
        precioPublico: grupo.precioPublicoGrupo,
        categoria: categoria || undefined,
      })
      onSuccess()
      onClose()
    } catch (error) {
      alert('Error: ' + String(error))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Convertir a Producto del Catálogo</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Nombre del Producto</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="Ej: Isla Central Granito"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Categoría (opcional)</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="">--Seleccionar--</option>
              <option value="Cocinas">Cocinas</option>
              <option value="Closets">Closets</option>
              <option value="Estudios">Estudios</option>
              <option value="Comedores">Comedores</option>
              <option value="Baños">Baños</option>
            </select>
          </div>

          <div className="bg-gray-100 p-3 rounded text-sm">
            <p>
              <strong>SKU:</strong> GRUPO-{grupo.id.substring(0, 8).toUpperCase()}
            </p>
            <p>
              <strong>Items:</strong> {grupo.items.length}
            </p>
            <p>
              <strong>Precio público:</strong> ${grupo.precioPublicoGrupo}
            </p>
            {grupo.contenedor?.fotosDisenio.length ? <p>✅ Tiene fotos</p> : <p>❌ Sin fotos</p>}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            onClick={handleConvertir}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={cargando}
          >
            {cargando ? 'Convirtiendo...' : 'Archivar & Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Integración en `page.tsx`:**
```typescript
const [grupoAConvertir, setGrupoAConvertir] = useState<GrupoItemCalculado | null>(null)
const [abrirModalConversor, setAbrirModalConversor] = useState(false)

// ... en el JSX:
<ConvertirGrupoAProductoModal
  grupo={grupoAConvertir}
  abierto={abrirModalConversor}
  onClose={() => setAbrirModalConversor(false)}
  onSuccess={() => {
    // Recargar cotizador
    refetchCotizador?.()
  }}
/>
```

**✅ Compilar:** `npm run tsc --noEmit`

---

### T3: Render de Grupos en Propuesta Pública

**Archivo:** `app/(publico)/propuesta/[proyectoId]/PropuestaPublicaClient.tsx`

**Ubicación:** Encontrar dónde se renderizan espacios (búsqueda: `espacios.map(`)

**Agregar después de ítems del espacio:**

```typescript
{/* Renderizar grupos */}
{obtenerGruposItemRootDelEspacio(espacio.id).map((grupo) => (
  <GrupoPropuestaPublica key={grupo.id} grupo={grupo} parametros={parametrosFinancieros} />
))}
```

**Crear componente:** `app/(publico)/propuesta/components/GrupoPropuestaPublica.tsx`

```typescript
'use client'

import type { GrupoItemCalculado } from '@/lib/data/contracts'
import { calcularGrupoConSubgrupos, type ParametrosManoObra } from '@/lib/data/queries/grupo-calculado'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  grupo: GrupoItemCalculado
  parametros: ParametrosManoObra
}

export function GrupoPropuestaPublica({ grupo, parametros }: Props) {
  const [expandido, setExpandido] = useState(false)

  // Tomar primera foto de diseño si existe
  const fotoPrincipal = grupo.contenedor?.fotosDisenio?.[0]

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpandido(!expandido)}
      >
        {/* Imagen */}
        {fotoPrincipal && (
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={fotoPrincipal}
              alt={grupo.nombre}
              fill
              className="object-cover rounded"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-bold text-lg">{grupo.nombre}</h3>
          {grupo.contenedor?.descripcion && <p className="text-sm text-gray-600">{grupo.contenedor.descripcion}</p>}
          <p className="text-xs text-gray-500 mt-1">{grupo.items.length} artículos</p>
        </div>

        {/* Precio */}
        <div className="text-right">
          <p className="text-xl font-bold text-green-700">${grupo.precioPublicoGrupo}</p>
          <p className="text-xs text-gray-500">Grupo</p>
        </div>
      </div>

      {/* Expandible */}
      {expandido && (
        <div className="border-t p-4 bg-white">
          {/* Items dentro del grupo */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2">Artículos incluidos:</h4>
            <ul className="space-y-1 text-sm">
              {grupo.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.nombrePersonalizado || 'Artículo'} (x{item.cantidad})</span>
                  <span>${item.totalLinea || '0'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Desglose de precios */}
          <div className="border-t pt-2 space-y-1 text-sm">
            <p className="flex justify-between">
              <span>Subtotal artículos:</span>
              <span>${grupo.sumaItemsNeto}</span>
            </p>
            <p className="flex justify-between">
              <span>+ IVA:</span>
              <span>${(parseFloat(grupo.sumaItemsConIVA) - parseFloat(grupo.sumaItemsNeto)).toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span>+ Mano de obra:</span>
              <span>${grupo.valorManoObraEstimada}</span>
            </p>
            <p className="flex justify-between font-bold border-t pt-1">
              <span>Total grupo:</span>
              <span>${grupo.precioPublicoGrupo}</span>
            </p>
          </div>

          {/* Subgrupos */}
          {grupo.subgrupos.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Componentes:</h4>
              {grupo.subgrupos.map((sub) => (
                <div key={sub.id} className="ml-4 border-l-2 border-gray-300 pl-4 mb-3">
                  <GrupoPropuestaPublica grupo={sub} parametros={parametros} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

**✅ Compilar:** `npm run tsc --noEmit`

---

### T4: Correcciones de Type-Safety (23 Errores TS)

**Archivos afectados:**

1. **PropuestaPublicaClient.tsx:711** → cambiar:
```typescript
urls={espacio.fotosDisenio ?? []}  // Agregar ?? []
```

2. **ContratoModal.tsx:665, 667** → cambiar:
```typescript
bloque.espacio.fotosDisenio?.map(...)  // Agregar ?. operator
```

3. **cotizador/page.tsx:1578-1657** → cambiar:
```typescript
espacio.fotosEspacio ?? []
espacio.fotosDisenio ?? []
espacio.fotosReferencia ?? []
```

4. **proyectos/page.tsx:377-381** → cambiar type:
```typescript
const galeriasPorGrupo: Array<{ label: string; urls: string[] }> = [
  // ...
  { label: 'Grupo 1', urls: g.urls ?? [] },  // Fallback a []
]
```

**Compilar después de cada corrección:** `npm run tsc --noEmit`

---

## PARTE C: Testing & Verificación

### Unit Tests

**Archivo:** Crear `lib/data/queries/grupo-calculado.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals'
import { calcularGrupoItemCalculado, type ParametrosManoObra } from './grupo-calculado'
import type { GrupoItemHidratado } from '@/lib/data/contracts'

describe('calcularGrupoItemCalculado', () => {
  const parametros: ParametrosManoObra = {
    tasaManoObraDesarrollo: 100,
    tasaManoObraEnsamblaje: 80,
    tasaManoObraInstalacion: 60,
    porcentajeIva: 19,
  }

  it('calcula precio público correctamente', () => {
    const grupo: GrupoItemHidratado = {
      id: 'test-1',
      espacioVarianteId: 'esp-1',
      nombre: 'Test Grupo',
      padreId: null,
      orden: 0,
      jornadasDesarrolloTecnico: '1',
      jornadasEnsamblajeTaller: '2',
      jornadasInstalacionObra: '0.5',
      estado: 'temporal',
      productoCatalogoId: null,
      contenedor: null,
      items: [
        {
          id: 'item-1',
          varianteId: 'var-1',
          catalogoId: null,
          nombrePersonalizado: 'Item 1',
          cantidad: '2',
          precioUnitario: '100',
          totalLinea: '200',
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
          createdAt: '',
          updatedAt: '',
        },
      ],
      subgrupos: [],
    }

    const resultado = calcularGrupoItemCalculado(grupo, parametros)

    expect(resultado.sumaItemsNeto).toBe('200.00') // 2 × 100
    expect(parseFloat(resultado.sumaItemsConIVA)).toBeCloseTo(238.0) // 200 × 1.19
    expect(parseFloat(resultado.valorManoObraEstimada)).toBe(
      100 * 1 + 80 * 2 + 60 * 0.5, // 100 + 160 + 30 = 290
    )
  })
})
```

**Ejecutar:** `DATABASE_URL='postgres://test' npx tsx lib/data/queries/grupo-calculado.test.ts`

---

## PARTE D: Checklist Final

**Antes de terminar:**

- [ ] T5: `obtenerGrupoItemHidratado` + `obtenerGruposItemRootDelEspacio` funcionan
- [ ] T6: `calcularGrupoItemCalculado` pasa tests
- [ ] T7: Fixtures compilan y tienen datos válidos
- [ ] T1: `GrupoItemEditor` se renderiza en cotizador
- [ ] T2: Modal "Convertir" abre y cierra correctamente
- [ ] T3: Propuesta pública muestra grupos colapsables
- [ ] T4: `npm run tsc --noEmit` sin errores TS
- [ ] `npm run build` completa sin warnings

**Compilación final:**
```bash
npm run tsc --noEmit
npm run build
```

---

## PARTE E: Notas de Integración

### Imports que necesitarás agregar:

```typescript
// En cualquier archivo que use grupos:
import { obtenerGrupoItemHidratado, obtenerGruposItemRootDelEspacio } from '@/lib/data/actions/lecturas-cotizador'
import { calcularGrupoItemCalculado } from '@/lib/data/queries/grupo-calculado'
import type { GrupoItemHidratado, GrupoItemCalculado } from '@/lib/data/contracts'
```

### Variables/Estados que necesitarás en componentes principales:

```typescript
// En cotizador/page.tsx:
const [grupoAConvertir, setGrupoAConvertir] = useState<GrupoItemCalculado | null>(null)
const [abrirModalConversor, setAbrirModalConversor] = useState(false)

// En propuesta/page.tsx (si es necesario):
const [parametrosFinancieros, setParametrosFinancieros] = useState<ParametrosManoObra>({
  tasaManoObraDesarrollo: 100,
  tasaManoObraEnsamblaje: 80,
  tasaManoObraInstalacion: 60,
  porcentajeIva: 19,
})
```

---

## Orden de Implementación Recomendado

```
1. T5 (Queries) ✓
   ↓
2. T6 (Cálculos) ✓
   ↓
3. T7 (Fixtures) ✓
   ↓
4. T1 (Componentes) + T4 (Type-safety) en paralelo ✓
   ↓
5. T2 (Modal) ✓
   ↓
6. T3 (Propuesta pública) ✓
   ↓
7. Compilar + verificar ✓
```

**Tiempo estimado:** 2-3 horas (depende de cambios adicionales en UI)

---

**¿Preguntas?** Todo está en `arnes/FASE_3_1_TODO.md` para referencia general.
