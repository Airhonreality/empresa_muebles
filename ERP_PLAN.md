# Plan ERP — Consolidación y Diseño Final (Revisión v2)
**Fecha revisión:** 2026-06-09
**Estado:** Corrección de implementación Gemini — lista para ejecutar

---

## Qué salió bien en la implementación anterior

| Ítem | Estado |
|------|--------|
| Canvas folder eliminado (`canvas/`) | ✅ Hecho |
| `FichaProduccion.tsx` creado | ✅ Hecho |
| `useProjectData.ts` movido a `specialized/` | ✅ Hecho |
| Ruta `/app/ficha/:id` con `context: "cotizaciones"` | ✅ Hecho |
| `agnostic.config.ts` limpio (8 bloques, sin registros muertos) | ✅ Hecho |
| Schema `ordenes_trabajo` descontaminado | ✅ Hecho |
| `apoyo_tecnico.json` creado como `[]` | ✅ Hecho |
| `ComercialCard.tsx` navega a `/app/ficha/:id` | ✅ Hecho |
| Navbars simplificadas | ✅ Hecho |
| Build limpio (0 errores de compilación) | ✅ Verificado |

---

## El error central de la implementación anterior

**Problema:** La ruta `/app/quoting/:id` fue **reemplazada** por un stack de
`AgnosticForm` genéricos (project_selector + form + collection + form + actions).

**Por qué es un error grave:**
El CotizadorPro (`/app/quoting`) es un componente custom completo con su propia
selección interna, cálculo de jornadas, variantes, galería de colores, catálogo
inline. No es solo un form — es el núcleo del sistema.

Al crear `/app/quoting/:id` con forms apilados, existen ahora **dos caminos para
editar una cotización**, uno bueno (CotizadorPro) y uno malo (los forms genéricos).
El malo apareció en segundo plano, silenciosamente, sin que el cotizador lo notara.

**Lo que debió haber ocurrido:** Apoyo Técnico se integra **dentro del CotizadorPro**
como un panel propio — no como un bloque agnostic encadenado afuera.

---

## Principios de diseño (sin cambios)

**Axioma 1 — Independencia:** cada pantalla, una tarea. Roles × tareas únicas.
**Axioma 2 — Mínimo de información:** carpintero no procesa precios. Diseñador no procesa estados de taller.
**Axioma 3 — Una fuente de verdad:** `cotizacion` ya es el proyecto. Estado = progresión.
**Regla de oro:** construir *alrededor* del CotizadorPro, no encima de él sin su conocimiento.

---

## Arquitectura de pantallas final (5 rutas)

| Ruta | Bloque | Actor | Propósito único |
|------|--------|-------|-----------------|
| `/app/quoting` | `cotizador_pro` | Diseñador | Lista + crear proyectos |
| `/app/quoting/:id` | `cotizador_pro` | Diseñador | Editar proyecto + apoyo técnico (panel interno) |
| `/app/ficha/:id` | `ficha_produccion` | Carpintero | Ver sin precios + anotar taller |
| `/app/catalog` | `table` + `form` | Admin | Catálogo de insumos |
| `/app/analytics` | `table` | Admin | Historial de snapshots PDF |

`/app/prefabricados` sobrevive intacta.

---

## Pasos de corrección — orden estricto

### PASO 1 — Restaurar `/app/quoting/:id` en `page_routes.json`

**Qué hacer:** En el registro `id: 966c3d81-e7a7-431d-8172-05b55a964d2e`,
reemplazar todos los bloques actuales (7 bloques: project_selector + 2 forms +
collection + 3 actions) por exactamente un solo bloque:

```json
{
  "id": "block_cotizador_pro_id",
  "type": "cotizador_pro",
  "context": "cotizaciones",
  "config": {
    "tarifa_jornada": 185000
  }
}
```

**Por qué solo uno:** El CotizadorPro maneja internamente su propio selector,
los forms de header/footer, las acciones (PDF, orden, contrato), y ahora también
el panel de Apoyo Técnico (Paso 3). No necesita ayuda de bloques agnostic externos.

**Archivos tocados:** `storage/db/page_routes.json` — solo el array `blocks` de
ese registro. Nada más.

---

### PASO 2 — Crear `ApoyoTecnicoPanel.tsx` en `cotizador/`

**Archivo:** `src/components/specialized/cotizador/ApoyoTecnicoPanel.tsx`

**Propósito:** Panel colapsable que vive dentro del CotizadorPro. Gestiona los
registros de `apoyo_tecnico` de la cotización activa. Es su propio archivo —
no infla `CotizadorPro.tsx`.

**Contrato de props:**
```typescript
interface Props {
  cotizacionId: string  // activeCotId del padre
}
```

**Estructura visual:**
```
┌─ Apoyo Técnico — Retoma y Requisitos ──── [2 registros] [+ Agregar] [▼] ─┐
│  (colapsado por defecto)                                                   │
└────────────────────────────────────────────────────────────────────────────┘

Cuando expandido:
┌─ Apoyo Técnico ──────────────────────────────────────────────── [+ Agregar] ─┐
│                                                                               │
│  [VISITA TÉCNICA]  📅 2026-06-01                                             │
│  Notas: Medición del muro norte, cliente confirma profundidad 60cm.           │
│  [Imagen]                                                                     │
│                                   ─────────────────────────────── [🗑]       │
│                                                                               │
│  [FOTO RETOMA]                                                               │
│  [imagen_url como <img>]                                                      │
│                                   ─────────────────────────────── [🗑]       │
│                                                                               │
│  ┌─ Nuevo Registro ─────────────────────────────────────────────────────┐    │
│  │  Tipo: [select]  Fecha visita: [date]                                │    │
│  │  Notas: [textarea]                                                   │    │
│  │  URL imagen/diagrama: [input]                                        │    │
│  │  Lista de requisitos: [textarea]                                     │    │
│  │                                          [Cancelar] [Guardar]       │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Estado interno del componente:**
```typescript
const [registros, setRegistros]     = useState<DataItem[]>([])
const [loading,   setLoading]       = useState(false)
const [expanded,  setExpanded]      = useState(false)
const [showForm,  setShowForm]      = useState(false)
const [form, setForm] = useState({
  tipo_recurso:    'Visita Técnica',
  fecha_visita:    '',
  notas:           '',
  imagen_url:      '',
  lista_requisitos: ''
})
```

**Tipos de recurso (select options):**
```
'Visita Técnica'
'Foto de Retoma'
'Diagrama / Croquis'
'Lista de Requisitos'
'Otro'
```

**API calls:**
- **Fetch on mount / when cotizacionId changes:** `GET /api/vault?namespace=apoyo_tecnico`
  → filtrar por `r.data.cotizacion_id === cotizacionId`
- **Crear:** `POST /api/vault { action: 'WRITE', namespace: 'apoyo_tecnico', record: { data: { cotizacion_id, ...form } } }`
- **Eliminar:** `POST /api/vault { action: 'REMOVE', namespace: 'apoyo_tecnico', id }`

**Diseño — debe coincidir con el lenguaje visual del cotizador:**
- Borde `border-stone-200`, fondo `bg-white`, `rounded-2xl`
- Header del panel: `bg-stone-50 border-b border-stone-200 px-4 py-3`
- Badge tipo: `bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold uppercase`
- Botón agregar: `border-dashed border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600`
- Botón guardar: `bg-amber-600 text-white hover:bg-amber-700`
- Misma tipografía y spacing que EspacioCard y el resto del cotizador

**Lo que NO incluye este componente:**
- No renderiza precios ni costos
- No tiene lógica de negocio ajena a `apoyo_tecnico`
- No importa nada de `useProjectData` (el hook es para FichaProduccion)

---

### PASO 3 — Inyectar `ApoyoTecnicoPanel` en `CotizadorPro.tsx`

**Archivo:** `src/components/specialized/cotizador/CotizadorPro.tsx`

**Qué modificar:** En el render del modo editor (cuando `activeCotId` es truthy),
agregar el panel justo antes del `<main>` que contiene los espacios:

```typescript
// Importar al inicio del archivo
import { ApoyoTecnicoPanel } from './ApoyoTecnicoPanel'

// En el JSX, entre </header> y <main ...>:
<div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4">
  <ApoyoTecnicoPanel cotizacionId={activeCotId} />
</div>
```

**Por qué este punto de inyección:**
- Está después del header (nombre + detalles del proyecto)
- Está antes de los espacios de mobiliario
- Es la lectura natural: proyecto → retoma/visitas → espacios → totales
- No interfiere con el cálculo de `gt` (grand totals) ni con el footer sticky

**Impacto en CotizadorPro.tsx:** 1 import + 3 líneas de JSX. No se toca
ningún estado, ningún handler, ningún cálculo existente.

---

## Lo que NO se toca

| Archivo | Razón |
|---------|-------|
| `src/components/specialized/cotizador/*` (excepto CotizadorPro.tsx) | No se toca |
| `storage/db/scripts.json` | Todos los zaps están bien |
| `storage/db/cotizaciones.json` | Datos de producción |
| `src/components/specialized/FichaProduccion.tsx` | Correcto, no tocar |
| `src/components/specialized/useProjectData.ts` | Correcto, no tocar |
| `storage/db/page_routes.json` (ruta `/app/ficha/:id`) | Correcta, no tocar |
| `agnostic.config.ts` | Correcto, no tocar |
| `packages/**` | Nunca |

---

## Checklist de ejecución (3 pasos)

```
[ ] PASO 1 — page_routes.json: restaurar /app/quoting/:id a un solo bloque cotizador_pro
[ ] PASO 2 — Crear src/components/specialized/cotizador/ApoyoTecnicoPanel.tsx
[ ] PASO 3 — CotizadorPro.tsx: 1 import + 3 líneas JSX para montar el panel
```

Cada paso es independiente y reversible.
El cotizador sigue funcionando igual tras el Paso 1 (solo pierde los forms redundantes).
El Paso 3 solo falla si el Paso 2 no existe.

---

## Resultado final esperado

**`/app/quoting`** — CotizadorPro en modo selector (lista de proyectos). Sin cambios.

**`/app/quoting/:id`** (o al seleccionar desde la lista) — CotizadorPro en modo editor:
```
[Header sticky: nombre proyecto · cliente · DETALLES ▾ · ELIMINAR]
  └─ [Subheader colapsable: cliente, dirección, días, garantía]

[Apoyo Técnico — Retoma y Requisitos ── 0 registros ── + Agregar ── ▼]
  └─ (expandido: lista + form de creación)

[EspacioCard: Cocina]
  └─ [Variantes: Con puerta corrediza | Sin puerta]
  └─ [Tabla de materiales]
  └─ [Jornadas colapsable]

[EspacioCard: Alcoba]
  └─ ...

[+ Agregar espacio]

[Footer sticky: Mat · M.O. · Subtotal | Costos · Imprevistos · Ajustes | TOTAL · Generar cotización]
```

**`/app/ficha/:id`** — FichaProduccion (sin cambios, ya funciona).
