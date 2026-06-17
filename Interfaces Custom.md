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
Estos componentes resuelven interacciones complejas de datos sin acoplamiento ni fugas de foco:

Combobox — select con búsqueda filtrada y opción de creación inline accesible:

```typescript
import { Combobox } from '@/components/ui/combobox'

const options = [
  { value: 'cliente_1', label: 'Juan Pérez' },
  { value: 'cliente_2', label: 'María Gómez' }
]

<Combobox
  options={options}
  value={selectedClient}
  onValueChange={setSelectedClient}
  placeholder="Seleccionar cliente..."
  searchPlaceholder="Buscar por nombre..."
  emptyMessage="No se encontraron clientes."
  // Opcional: permite crear un cliente nuevo si no existe en la lista
  onCreateOption={(newLabel) => handleCreate(newLabel)}
  createLabel="Crear cliente"
/>
```
// Resuelve la accesibilidad ARIA y el click-outside nativo usando Radix Popover + cmdk (sin listeners manuales).

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
SmartImageInput — selector multimedia unificado: URL, Ctrl+V, drag & drop, file picker. Single o múltiple:


import { SmartImageInput } from '@/components/ui/SmartImageInput'

// — Modo single (default) ——————————————————————————————————————
<SmartImageInput
  value={imageUrl}           // string
  onChange={setImageUrl}     // (url: string) => void
  accept="image/*"           // default — cualquier imagen
  placeholder="https://..."
/>

// — Modo múltiple ———————————————————————————————————————————————
<SmartImageInput
  multiple
  value={urls}               // string[]
  onChange={setUrls}         // (urls: string[]) => void
  accept="image/*"
/>

// — Archivos no imagen (PDFs, vídeos…) ————————————————————————
<SmartImageInput
  accept="application/pdf,video/mp4"
  value={fileUrl}
  onChange={setFileUrl}
/>

// Interacciones soportadas automáticamente:
// · Arrastra archivos al componente
// · Ctrl+V para pegar imagen del portapapeles
// · Escribe/pega URL y pulsa Enter (múltiple) o la editas en vivo (single)
// · Botón de explorador de archivos
// Sube via POST /api/upload · Muestra preview inline · ✕ por item
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
// Incluye SmartImageInput para campos type:'image' y type:'file' (single y múltiple)
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

// Autoguardado con debounce contextual (evita race conditions al cambiar de ID o desmontar)
import { useAutoSave } from '@/hooks/useAutoSave'

useAutoSave({
  key: activeCotizacionId,   // Identificador de contexto activo
  data: formValues,           // Datos a guardar
  delay: 1500,                // Opcional: debounce en ms (default: 1500)
  onSave: async (latestData) => {
    await saveItem('cotizaciones', { id: activeCotizacionId, data: latestData })
  }
})
// Si key cambia, guarda inmediatamente los cambios pendientes del ID anterior.
// Al desmontarse el componente, guarda automáticamente los datos si hay cambios pendientes.
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
Escritura — siempre vía saveItem (nunca fetch crudo)

import { useAppDispatch } from '@/context/AppContext'
const { saveItem } = useAppDispatch()

const save = async (id: string | undefined, data: MiSchema) => {
  await saveItem(context, { id, data })
  // saveItem actualiza Zustand y persiste en /api/vault — no se necesita refresh()
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
6. Tokens CSS — dos capas, solo una es tuya
El engine inyecta los tokens en dos pasos:

1. globals.css (seed) define los --sat-* como fallbacks del engine (tracked en git)
2. storage/styles/tokens.css sobreescribe esos fallbacks con los valores del proyecto

layout.tsx los inyecta en orden:
  <style>{tokenStyles}</style>   ← storage/styles/tokens.css (tuyo)
  globals.css                    ← defaults del engine (del seed)

El archivo tokens.css se regenera con /api/tokens/sync cada vez que guardas en el TokensEditor.
También puedes editarlo directamente en storage/styles/tokens.css.

Regla de sync: storage/ es gitignoreado → el sync nunca toca tokens.css.
Tus variables CSS sobreviven cualquier merge del engine intactas.

Donde editas	¿Sobrevive sync?	Cuándo usarlo
storage/styles/tokens.css	✅ Siempre	Customización de proyecto (--sat-bg, --sat-accent, etc.)
src/app/globals.css	⚠️ Conflicto si el seed también lo toca	Nunca para customizar un proyecto
src/styles/layout_tokens.css	⚠️ Conflicto si el seed también lo toca	Nunca para customizar un proyecto

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
Variables CSS del proyecto	storage/styles/tokens.css	src/app/globals.css

---

## 8. Llamar a un Zap desde un componente especializado

Un componente `specialized/` **nunca llama directamente a `/api/engine`**. La ruta correcta es usar un bloque `AgnosticAction` en la ruta, o dejar que el componente especializado llame a un endpoint propio (`/api/pdf`, `/api/chart`, etc.) que opera fuera del vm sandbox.

Si el componente tiene un botón que necesita disparar un Zap:

```typescript
// ✅ Patrón correcto: usar AgnosticAction compuesto dentro del especializado
import { AgnosticAction } from '@/components/agnostic/blocks/AgnosticAction'

<AgnosticAction
  zap="exportar_propuesta_pdf"
  label="Exportar PDF"
  visual={{ icon: 'Download', variant: 'default' }}
  record={activeCotizacion}
  context="cotizaciones"
/>
```

Si necesitas capturar el resultado del Zap (por ejemplo para actualizar estado local):

```typescript
// POST directo cuando necesitas procesar la respuesta en el componente
const runZap = async () => {
  const res = await fetch('/api/engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      zap: 'calcular_totales',
      payload: { record: activeCotizacion, context: 'cotizaciones' }
    })
  });
  const { success, events } = await res.json();
  // procesa los events directamente aquí — no dependas de AgnosticAction para esto
  const syncEvent = events.find((e: any) => e.action === 'materia_sync');
  if (syncEvent) setLocalState(syncEvent.item);
};
```

**Regla:** si el Zap solo necesita efectos secundarios (toast + sync), usa `AgnosticAction`. Si el componente necesita reaccionar al resultado, llama `/api/engine` directamente y procesa `events` tú mismo.

---

## 9. Eventos nativos del engine — vocabulario de salida de Zaps

`api.dispatchEvent(action, payload)` encola eventos que `AgnosticAction.tsx` procesa en el cliente después de que el Zap completa. Cada evento es stateless y sin dominio — el Zap empaqueta datos, el cliente sabe qué hacer.

### Los 8 eventos disponibles

```javascript
// ─── FEEDBACK AL USUARIO ──────────────────────────────────────────────────
api.dispatchEvent('notify', { type: 'success', message: 'Guardado' })
api.dispatchEvent('notify', { type: 'error',   message: 'Falló X' })
// → toast en el cliente (sonner)

// ─── SINCRONIZACIÓN DE ESTADO ─────────────────────────────────────────────
api.dispatchEvent('materia_sync', { context: 'cotizaciones', item: recordActualizado })
// → actualiza Zustand sin reload — el UI refleja el cambio inmediatamente

// ─── DOCUMENTOS ───────────────────────────────────────────────────────────
api.dispatchEvent('print_pdf', { html: htmlString })
// → iframe oculto → window.print() — espera fonts.ready antes de imprimir

api.dispatchEvent('download_pdf', {
  template: 'nombre_en_pdf_templates',  // DataItem en storage/db/pdf_templates.json
  inputs: [{ campo1: 'valor1' }],       // array de objetos (uno por página)
  filename: 'documento.pdf'             // opcional
})
// → POST /api/pdf → pdfme → descarga binaria sin diálogo del navegador

api.dispatchEvent('download_file', {
  content: csvString,
  filename: 'reporte.csv',
  mimeType: 'text/csv'   // text/plain | text/csv | application/json | ...
})
// → Blob → <a download> — cualquier texto generado en el Zap

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────
api.dispatchEvent('redirect', { path: '/cotizaciones' })
// → window.location.href — navegación hard, refresca el estado completo

api.dispatchEvent('open_url', { url: 'https://wa.me/57...', target: '_blank' })
// → window.open — links externos (WhatsApp, Stripe, Drive, etc.)

// ─── UTILIDADES ───────────────────────────────────────────────────────────
api.dispatchEvent('clipboard', { text: codigoGenerado })
// → navigator.clipboard.writeText + toast "Copiado al portapapeles"
```

### Regla de cuándo agregar un evento nativo

Un evento es nativo solo si su handler en `AgnosticAction.tsx` es **stateless y sin dominio**. Si el handler necesita saber algo sobre el negocio para funcionar → no es nativo; el Zap debe resolver ese conocimiento antes de dispatchar.

```
✅ clipboard  → el handler solo llama navigator.clipboard.writeText(text)
✅ redirect   → el handler solo hace window.location.href = path
❌ confirm    → requiere abrir un modal (estado de UI) → pertenece al componente especializado
❌ send_email → tiene dominio (credenciales, templates) → el Zap llama al servicio externo
```

### Múltiples eventos en un solo Zap

Los eventos se procesan **secuencialmente** en el orden en que se dispatchan. Puedes combinarlos:

```javascript
// Un Zap puede emitir varios eventos — se ejecutan en orden
await api.saveItem('cotizaciones', { id: cot.id, data: { estado: 'exportada' } });
// ^ saveItem ya encola automáticamente un materia_sync

api.notify.success('Propuesta exportada y guardada');

api.dispatchEvent('download_pdf', {
  template: 'propuesta_comercial',
  inputs: [datosCalculados],
  filename: `propuesta_${cliente.nombre}.pdf`
});

api.dispatchEvent('redirect', { path: '/cotizaciones' });
// el redirect ocurre DESPUÉS de que el PDF se descargó
```

---

## 10. Sistema de documentos PDF

### Arquitectura completa

```
Zap (server-side)
  ├─ api.dispatchEvent('print_pdf', { html })      ← HTML artesanal, imprime con ventana del navegador
  └─ api.dispatchEvent('download_pdf', {           ← pdfme, descarga binaria directa
       template, inputs, filename
     })
         ↓
AgnosticAction.tsx procesa el evento
  print_pdf  → iframe oculto → fonts.ready → window.print()
  download_pdf → POST /api/pdf → pdfme.generate() → blob → <a download>
```

### Cómo usar `download_pdf` desde un Zap

```javascript
// storage/db/scripts.json — script: exportar_reporte_csv
const clientes = await api.query('clientes');

// Opción A: PDF desde template pdfme
api.dispatchEvent('download_pdf', {
  template: 'reporte_clientes',   // debe existir en pdf_templates namespace
  inputs: clientes.map(c => ({
    nombre: c.nombre,
    email: c.email,
    total_compras: c.total_compras
  })),
  filename: 'reporte_clientes.pdf'
});

// Opción B: CSV desde contenido generado
const csv = ['nombre,email,total']
  .concat(clientes.map(c => `${c.nombre},${c.email},${c.total_compras}`))
  .join('\n');

api.dispatchEvent('download_file', {
  content: csv,
  filename: 'clientes.csv',
  mimeType: 'text/csv'
});
```

### Estructura de un template pdfme

Las plantillas viven en `storage/db/pdf_templates.json` como DataItems estándar:

```json
{
  "id": "uuid-generado",
  "context": "pdf_templates",
  "data": {
    "name": "reporte_clientes",
    "description": "Reporte mensual de clientes",
    "template": {
      "basePdf": "BLANK_PDF",
      "schemas": [[
        {
          "name": "nombre",
          "type": "text",
          "position": { "x": 20, "y": 20 },
          "width": 100,
          "height": 8,
          "fontSize": 12
        },
        {
          "name": "email",
          "type": "text",
          "position": { "x": 20, "y": 32 },
          "width": 100,
          "height": 8,
          "fontSize": 10
        }
      ]]
    }
  }
}
```

Cada elemento del array `inputs` en el Zap debe tener las mismas claves que los `name` del schema de pdfme.

### PdfTemplateManager — bloque especializado incluido

El seed incluye `src/components/specialized/PdfTemplateManager.tsx`. Para usarlo:

```
# 1. Registrar en agnostic.config.ts
blocks: {
  pdf_template_manager: () => import('./src/components/specialized/PdfTemplateManager'),
}

# 2. Agregar a una ruta de administración
agno> add-block /admin pdf_template_manager

# 3. El bloque lee de pdf_templates, lista templates existentes,
#    permite probar generación directamente y muestra snippets de Zap.
```

### Gráficas en PDFs — patrón server-side

Para incluir charts en documentos (`print_pdf` o `download_file`):

```javascript
// Dentro del Zap — genera imagen del chart y la embebe en el HTML
// Requiere: npm install chartjs-node-canvas (ver instrucciones en /api/pdf/chart/route.ts)

// El Zap NO puede llamar fetch() interno — esto se resuelve en el componente
// o en una ruta especializada fuera del sandbox.

// Patrón recomendado: el componente genera la imagen y la pasa como payload al Zap
// (ver CotizadorPro.tsx para referencia de cómo pasar datos al payload del engine)
```
