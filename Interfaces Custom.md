Sistema de interfaces, widgets y personalización avanzada
1. Las dos capas del sistema de tipos
indra.ts — el contrato canónico del engine (solo lectura):


// Los tipos que usarás directo:
DataItem          → envoltura universal { id, context, data: Record<string, unknown> }
SchemaField       → definición de un campo con su tipo, config, relación
NodeStyle         → CSS puro en camelCase (React CSSProperties)
NodeDesign        → modelo semántico de diseño (sizing, layout, fill, stroke…)
AgnosticAPI       → lo que recibe tu bloque como prop `api`
BlockProps        → la prop tipada que acepta cada componente especializado
src/generated/agnostic-schemas.ts — el contrato de tus datos (auto-generado):


// Se genera corriendo: npm run agnostic:compile
// Ejemplo del proyecto actual:
export interface EspacioVariantes {
  cotizacion_id:   string
  nombre_variante: string
  activa?:         boolean
  jornadas_*?:     number
}
export type EspacioVariantesRecord = AgnosticDataItem<EspacioVariantes>
Regla: importa siempre desde @/generated/agnostic-schemas, nunca typeas a mano los datos de negocio.

2. Inventario real de widgets — lo que existe en el codebase
Capa 1 — Primitivos Radix UI (src/components/ui/)
Cada uno es un wrapper thin sobre @radix-ui/* con Tailwind + CVA. Todos accesibles, animados con data-[state].

Componente	Importación	Qué hace
Button	@/components/ui/button	Variantes: default destructive outline secondary ghost link. Sizes: default sm lg icon
Input	@/components/ui/input	Input de texto base
Textarea	@/components/ui/textarea	Textarea base
Label	@/components/ui/label	Label accesible con htmlFor
Badge	@/components/ui/badge	Chip de estado. Variantes: default secondary destructive outline
Card	@/components/ui/card	Card + CardContent + CardHeader + CardTitle + CardFooter
Separator	@/components/ui/separator	Línea divisoria (Radix, orientación h/v)
Skeleton	@/components/ui/skeleton	Placeholder de carga con pulse
Select	@/components/ui/select	Select + SelectTrigger + SelectValue + SelectContent + SelectItem (Radix, accessible)
Checkbox	@/components/ui/checkbox	Checkbox Radix con checked / onCheckedChange
Switch	@/components/ui/switch	Toggle booleano Radix
Slider	@/components/ui/slider	Range slider Radix
Toggle	@/components/ui/toggle	Botón con estado on/off (Radix)
ToggleGroup	@/components/ui/toggle-group	Grupo de toggles mutuamente excluyentes
Tabs	@/components/ui/tabs	Tabs + TabsList + TabsTrigger + TabsContent (Radix)
Accordion	@/components/ui/accordion	Acordeón expandible Radix
Dialog	@/components/ui/dialog	Modal: Dialog + DialogContent + DialogHeader + DialogTitle + DialogDescription
Sheet	@/components/ui/sheet	Panel lateral deslizante. side: right|left|top|bottom. Componentes: Sheet SheetTrigger SheetContent SheetHeader SheetFooter SheetTitle SheetDescription SheetClose
Popover	@/components/ui/popover	Popover + PopoverTrigger + PopoverContent (Radix, floating)
Tooltip	@/components/ui/tooltip	TooltipProvider + Tooltip + TooltipTrigger + TooltipContent
Capa 2 — Inputs especializados (src/components/ui/)
Estos tres son los que probablemente no conocías:

ScrubInput — input numérico con drag horizontal estilo Figma/Blender:


import { ScrubInput } from '@/components/ui/ScrubInput'

<ScrubInput
  value={padding}
  onChange={setPadding}
  min={0} max={100} step={1}
  icon={ArrowLeftRight}       // icono lucide opcional
  placeholder="0"
/>
// Click-drag arrastra el valor. Click sin movimiento → modo texto editable.
SmartImageInput — input de imagen con tres modos (URL escrita, paste de portapapeles, file picker):


import { SmartImageInput } from '@/components/ui/SmartImageInput'

<SmartImageInput
  value={imageUrl}
  onChange={setImageUrl}
  placeholder="https://... o pega imagen (Ctrl+V)"
/>
// Muestra preview, botón ✕ para limpiar, sube via POST /api/upload
TokenOrStaticInput — input dual: valor estático OR referencia a CSS variable del design token:


import { TokenOrStaticInput } from '@/components/ui/TokenOrStaticInput'

<TokenOrStaticInput
  value={colorValue}          // puede ser "#fff" o "var(--primary)"
  onChange={setColorValue}
  category="color"            // 'spacing'|'color'|'typography'|'radius'|'shadow'|'custom'
  tokens={designTokens}       // DesignToken[] del sistema de tokens del proyecto
  label="Fill"
/>
// Botón ✨/T toggle entre modo estático y modo token
Capa 3 — Bloques del engine (src/components/agnostic/blocks/)
Estos son los módulos compuestos reales. No los llamas directamente — los usa el renderer — pero puedes componerlos en tus specialized/:

AgnosticForm — el más potente:


import { AgnosticForm } from '@/components/agnostic/blocks/AgnosticForm'

<AgnosticForm
  schema={schema}              // SchemaField[] — auto-genera todos los campos
  record={activeRecord}        // para modo edit
  context="cotizaciones"
  segmentation_key="espacio"   // divide el form en tabs/steps/select por este campo
  segmentation_strategy="tabs" // 'tabs' | 'steps' | 'select'
  projection={['nombre', 'estado']}  // solo estos campos
  hideHeader
  onSuccess={(record) => refetch()}
  onFieldChange={(key, val, all) => setPreview(all)}  // live preview hook
/>
// Incluye RelationField: select con búsqueda interna + lazy load de entidad
// Incluye SmartImageInput para campos imagen_url
// Incluye ReactMarkdown preview para campos notas_markdown
// registerForm() integrado para save_forms_first en AgnosticAction
AgnosticCollection — orquestador de sets:


// Vistas disponibles:
view="card_grid"      // grilla de tarjetas
view="table"          // tabla con AgnosticTable
view="editor_stack"   // stack editable
view="details"        // vista detalle

// Agrupación:
group_by_key="estado" // agrupa registros por valor de este campo

// Segmentación con filtro relacional:
segmentation_key="cotizacion_id"  // filtra por relación padre
AgnosticTable — tabla con búsqueda + sort + edit inline:

Búsqueda global (SlidersHorizontal icon)
Sort por columna (click header)
Edit row → abre Sheet + AgnosticForm
Delete con confirmación
Resolución de relation labels (ID → nombre legible) vía useRelationData
AgnosticAction — botón que dispara zap:


// Props reales:
zap="nombre_del_script"
visual={{ variant: 'default', size: 'sm', icon: 'Download' }}
save_forms_first={true}   // llama saveAllForms() antes del zap
AgnosticNavbar — navbar sticky con active link:


// Por nav_id (data-driven desde app_navbars):
nav_id="main"
// O inline:
links={[{ label: 'Inicio', path: '/', icon: 'Home' }]}
brand={{ label: 'Mi App', path: '/' }}
AgnosticBelt — barra breadcrumb sticky con path derivado del estado:


<AgnosticBelt moduleName="Cotizaciones" onOpenConfig={() => setOpen(true)} />
// Muestra: Indra > cotizaciones > [segmento activo]
Capa 4 — Hooks del engine (importables en specialized/)

// Relación lazy — carga una entidad en demanda, cachea en Zustand
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
const { data: clientes, isLoading } = useRelationData('clientes')

// Filtro universal — exportado desde DataBrowser
import { useRecordFilter, FilterState } from '@/components/specialized/DataBrowser'
const filtered = useRecordFilter(records, schema.fields, filterState)

// Registro de forms para save_forms_first
import { registerForm, saveAllForms } from '@/lib/agnostic/formRegistry'
useEffect(() => registerForm('mi-form-id', async () => await save()), [])
Patrón compuesto más útil — Sheet Editor
La combinación que el sistema usa internamente en AgnosticTable para edición:


import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AgnosticForm } from '@/components/agnostic/blocks/AgnosticForm'

const [editRecord, setEditRecord] = useState<DataItem | null>(null)

<Sheet open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Editar {schema.name}</SheetTitle>
    </SheetHeader>
    {editRecord && (
      <AgnosticForm
        schema={schema}
        record={editRecord}
        context={context}
        hideHeader
        onSuccess={() => { setEditRecord(null); refresh() }}
      />
    )}
  </SheetContent>
</Sheet>
Lucide — iconografía
Todo el sistema usa lucide-react. En AgnosticAction y AgnosticNavbar se resuelven dinámicamente por nombre de string:


import * as Icons from 'lucide-react'
const Icon = Icons['Download'] as React.ComponentType<{ size?: number }>
Disponibles: todos los iconos de lucide.dev — más de 1400.

3. Cómo incorporar un bloque especializado

// 1. Crear: src/components/specialized/MiBloque.tsx
'use client'
import type { BlockProps } from '@agnostic/core'
import type { MiSchemaRecord } from '@/generated/agnostic-schemas'

export default function MiBloque({ block, records, api }: BlockProps) {
  const typed = records as MiSchemaRecord[]
  // ...
}

// 2. Registrar: agnostic.config.ts
blocks: {
  mi_bloque: () => import('./src/components/specialized/MiBloque'),
}

// 3. Vincular: agno CLI
// agno> add-block /mi-ruta mi_bloque context:mi_schema
El engine pasa estos props ya resueltos a tu componente:


records       // DataItem[] de block.context — ya hidratados desde Zustand
schema        // SchemaField[] del schema vinculado
context       // string: nombre del schema
activeRecord  // DataItem | null: registro activo en la URL
api           // AgnosticAPI: dispatch, notify, ui, getConfig
block         // la definición cruda del bloque (para leer config custom)
4. Reactividad sin entropía de renderizado
Patrón correcto: usar records prop, nunca el store directo

// ❌ ENTROPÍA: re-suscribe a TODO el store — re-renderiza en cualquier cambio
const { data: materia } = useMateriaStore()
const records = materia['cotizaciones']

// ✅ CORRECTO: el engine ya resolvió esto — úsalo directamente
export default function MiBloque({ records }: BlockProps) {
  const cotizaciones = records as CotizacionesRecord[]
}
useMemo para transformaciones pesadas

const totals = useMemo(() =>
  cotizaciones.map(r => ({
    id:    r.id,
    total: r.data.items?.reduce((s, i) => s + i.precio * i.cantidad, 0) ?? 0,
  })),
[cotizaciones]  // ← solo dep estricta, no el store completo
)
Fetch propio (cuando necesitas datos fuera del context principal)

// Para datos secundarios no pasados como records:
const fetchSecondary = useCallback(async () => {
  const res  = await fetch('/api/vault?namespace=productos_catalogo')
  const json = await res.json()
  setProductos(json.data ?? [])
}, [])  // sin deps — solo se llama explícitamente

useEffect(() => { fetchSecondary() }, [fetchSecondary])
Escritura — siempre /api/vault

const save = async (id: string | undefined, data: MiSchema) => {
  await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ namespace: context, id, data }),
  })
  await refresh()  // re-fetch local — no mutar el store directamente
}
5. WebGL y canvas avanzado — patrón sin entropía
La regla central: el estado de WebGL vive en useRef, nunca en useState.


'use client'
import { useEffect, useRef, useMemo } from 'react'
import type { BlockProps } from '@agnostic/core'
import type { ProductosCatalogoRecord } from '@/generated/agnostic-schemas'

export default function Viewer3D({ records, block }: BlockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef     = useRef<WebGLRenderingContext | null>(null)
  const rafRef    = useRef<number>(0)

  // Derivar datos una vez con useMemo — no state de React
  const productos = useMemo(
    () => (records as ProductosCatalogoRecord[]).filter(r => r.data.modelo_3d),
    [records]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Inicializar WebGL — solo una vez
    const gl = canvas.getContext('webgl2')
    if (!gl) return
    glRef.current = gl

    // Loop de render — totalmente fuera de React
    const render = () => {
      gl.clear(gl.COLOR_BUFFER_BIT)
      // ... draw calls
      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)

    // CRÍTICO: cleanup siempre — evita memory leaks y doble montaje (React 18 Strict)
    return () => {
      cancelAnimationFrame(rafRef.current)
      glRef.current = null
    }
  }, [])  // ← sin deps: el loop no depende de React state

  // Cuando cambian los datos — actualizar buffers sin reiniciar WebGL
  useEffect(() => {
    const gl = glRef.current
    if (!gl || !productos.length) return
    // uploadBuffers(gl, productos) — operación sobre gl directamente
  }, [productos])  // ← solo cuando cambian los datos tipados

  return <canvas ref={canvasRef} className="w-full h-full" />
}
Con Three.js (misma separación)

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Renderer, scene, camera → refs (no state)
const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
const sceneRef    = useRef(new THREE.Scene())
const cameraRef   = useRef(new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000))

useEffect(() => {
  const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current! })
  rendererRef.current = renderer

  const animate = () => {
    rafRef.current = requestAnimationFrame(animate)
    renderer.render(sceneRef.current, cameraRef.current)
  }
  animate()

  return () => {
    cancelAnimationFrame(rafRef.current)
    renderer.dispose()  // liberar memoria GPU
    rendererRef.current = null
  }
}, [])
6. Llamar a un Zap desde un componente especializado

Cuando un specialized/ necesita ejecutar lógica de servidor (zap), llama `/api/engine` directamente y procesa los eventos en el mismo componente. **No toques AppContext.tsx ni ningún archivo del engine.**

```typescript
const ejecutarZap = async () => {
  const response = await fetch('/api/engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zap: 'nombre_del_zap', payload: { ...datos } }),
  })

  if (!response.ok) throw new Error(`Error ${response.status}`)

  const result = await response.json()
  if (!result.success) throw new Error(result.error)

  // Procesar eventos del engine — siempre en el componente, nunca en AppContext
  for (const event of result.events ?? []) {
    if (event.action === 'notify') {
      event.type === 'success' ? toast.success(event.message) : toast.error(event.message)

    } else if (event.action === 'materia_sync') {
      // Si el zap mutó datos que este componente muestra, re-fetch:
      await refetch()

    } else if (event.action === 'print_pdf') {
      // Iframe invisible — evita bloqueador de popups del navegador
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;'
      document.body.appendChild(iframe)
      iframe.contentDocument!.open()
      iframe.contentDocument!.write(event.payload?.html || '')
      iframe.contentDocument!.close()
      iframe.contentWindow!.focus()
      setTimeout(() => {
        iframe.contentWindow!.print()
        setTimeout(() => document.body.removeChild(iframe), 2000)
      }, 500)
    }
  }
}
```

**Regla absoluta:** si el zap hace todo lo que necesitas, no tienes que tocar nada fuera de `src/components/specialized/`. Si sientes la necesidad de modificar `AppContext.tsx`, `route.ts` o cualquier archivo de `packages/` — para. El problema está en cómo llamas al zap, no en el engine.

7. Resumen — reglas de oro para especializar sin entropía
Decisión	Correcto	Evitar
Datos del schema propio	records prop	useMateriaStore() directo
Datos de schema secundario	fetch('/api/vault?namespace=X')	Import del adapter
Tipos de datos	@/generated/agnostic-schemas	Tipos manuales
Estado WebGL / canvas	useRef	useState para objetos GL
Transformaciones derivadas	useMemo con deps estrictas	Calcular en render inline
Config del bloque	block.config.mi_param	Props hardcodeados
Cleanup de efectos	return () => cancelAnimationFrame(...)	No cleanup → memory leak
Escritura de datos	POST /api/vault	Adapter importado directamente
Lógica de negocio compleja	Script zap via POST /api/engine	Lógica en el componente
