Concepto — El Project Canvas Unificado
El modelo de dos ejes
La clave es que no hay contradicción entre sellos y tabs: son dos dimensiones ortogonales. Los sellos navegan tiempo (fases del proyecto). Los tabs dentro de cada sello navegan tipo de contenido (vistas paralelas dentro de una fase). No se mezclan — cada uno tiene su dominio.


EJE VERTICAL (tiempo)          EJE HORIZONTAL (contenido)
━━━━━━━━━━━━━━━━━━━━           ━━━━━━━━━━━━━━━━━━━━━━━━━
① DISEÑO     → activo          [📷 Fotos][📐 Diagramas][📋 Requisitos]
② COTIZACIÓN → colapsado       [tabla de espacios + items inline]
③ CONTRATO   → bloqueado       [cláusulas + plazo + garantía]
④ PAGOS      → bloqueado       [3 abonos con status]
⑤ PRODUCCIÓN → bloqueado       [OT + tareas + 3D]
⑥ ENTREGA    → bloqueado       [acta + garantía]
Regla simple para decidir qué usa tabs vs collapsible vs flat:

Tabs → contenido paralelo del mismo peso (Diseño: fotos / diagramas / requisitos)
Collapsible → contenido pesado que conviene ocultar por defecto (Cotización)
Flat list → contenido compacto que siempre vale la pena ver (Pagos: 3 líneas máximo)
Los 6 sellos y su contenido interno

┌────────────────────────────────────────────────────────┐
│ ◉ Giraldo — Closets          ● En contrato    [←][×]  │  ← header fijo
│   Yeni Paola · Cra 101 150a 60 · $19.000.000           │
├──┬─────────────────────────────────────────────────────┤
│  │                                                      │
│ ✓├─ DISEÑO COMERCIAL              [visita: 15 may] ›   │  ← sello completado
│  │  2 fotos · 1 diagrama · 3 requisitos                 │    colapsado
│  │                                                      │
│ ✓├─ COTIZACIÓN                    [2 espacios] ›        │  ← colapsado por default
│  │  ▸ Ver desglose completo                             │    cuando se abre:
│  │  [Oficina 5]  [Sala]                                 │    cotizador embebido
│  │                                                      │
│ ◆╠═ CONTRATO                      ← FASE ACTUAL        │  ← ACTIVO
│  ║  CT-2026-001 · Borrador                              │
│  ║  Plazo: __________________ ← campo editable inline   │
│  ║  Garantía: 2 años                                    │
│  ║  ─────────────────────────────                       │
│  ║  Pagos    ██████░░░░  1 de 3                         │
│  ║  ✓ $9.500.000  ○ $4.750.000  ○ $4.750.000           │
│  ║  [$ Registrar abono]                                 │
│  ║  ─────────────────────────────                       │
│  ║  Correo: ________________                            │
│  ║  [↗ Abrir en cliente de correo] [✓ Marcar enviado]  │
│  │                                                      │
│ 🔒├─ PRODUCCIÓN                   pendiente anticipo    │  ← bloqueado
│  │                                                      │
│ 🔒└─ ENTREGA                      pendiente producción  │  ← bloqueado
│                                                         │
└────────────────────────────────────────────────────────┘
Sello de Diseño Comercial — estructura interna
Este sello es nuevo y tiene tabs horizontales internos:


◆ DISEÑO COMERCIAL
┌──────────────────────────────────────────┐
│ [📷 Fotos] [📐 Diagramas] [📋 Requisitos]│
├──────────────────────────────────────────┤
│ tab activo: Fotos                         │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ img  │ │ img  │ │  +   │            │
│  └──────┘ └──────┘ └──────┘            │
│  [+ Agregar foto]                        │
└──────────────────────────────────────────┘
Schema apoyo_tecnico — mínimo viable:


cotizacion_id   → relation(cotizaciones)
fecha_visita    → date
fotos_espacio   → image  (múltiple: se guarda 1 record por foto)
diagramas       → image
notas_visita    → text
lista_requisitos → markdown
Cada foto es un registro separado (mismo patrón que imagenes_espacio). Esto permite galería infinita sin complejidad.

Sello de Cotización — cotizador embebido
Cuando el usuario expande este sello no navega — el cotizador se renderiza inline dentro del Sheet. La clave: el Sheet crece a full-width cuando la cotización está abierta (transición CSS de 640px → 100vw). Al colapsar vuelve al ancho normal.


▾ COTIZACIÓN           [abrir cotizador completo ↗]
┌──────────────────────────────────────────────┐
│  Oficina 5                          $4.2M    │  ← accordion por espacio
│  ▸ 12 materiales                            │
│                                              │
│  Sala                               $3.1M   │
│  ▸ 8 materiales                             │
│                                              │
│  Total: $19.000.000                         │
│  [Exportar PDF]                              │
└──────────────────────────────────────────────┘
Control de visibilidad por whitelist — diseño axiótico
Principio: la visibilidad es configuración de datos, no lógica de código. Cada sello tiene un id y la whitelist vive en un JSON. Cambiar qué ve cada rol = editar un JSON, sin tocar TSX.


// storage/empresa-2/db/ai_config.json (ya existe)
{
  "canvas_sections": {
    "diseno":     ["admin", "comercial", "disenador"],
    "cotizacion": ["admin", "comercial"],
    "contrato":   ["admin", "comercial"],
    "pagos":      ["admin", "comercial", "gerencia"],
    "produccion": ["admin", "taller"],
    "entrega":    ["admin", "taller", "comercial"]
  }
}
En el componente:


// hook ultra simple, sin magia
const { canSee } = useSectionPermissions(currentUser.role)

// cada sello
{canSee('produccion') && <SelloProduccion ... />}
El useSectionPermissions lee ai_config del store (ya hidratado por el engine). No hay fetch extra, no hay middleware.

La interface en números
Interfaz	Antes	Con el canvas
Rutas para trabajar un proyecto	3-4	1
Saltos de contexto por fase	4-5	0
Módulos TSX totales	8	12 (+ potentes)
Combinaciones de vista posibles	~5	~40 (sellos × tabs × roles)
Para agregar un rol nuevo	code change	editar JSON
Arquitectura de archivos

src/components/specialized/canvas/
├── ProjectCanvas.tsx          ← Sheet container + header fijo
├── useSectionPermissions.ts   ← hook de whitelist
├── CanvasTimeline.tsx         ← línea vertical + conectores
├── sellos/
│   ├── SelloDiseno.tsx        ← tabs: fotos/diagramas/requisitos
│   ├── SelloCotizacion.tsx    ← cotizador embebido colapsable
│   ├── SelloContrato.tsx      ← editable inline
│   ├── SelloPagos.tsx         ← 3 abonos + $ form
│   ├── SelloProduccion.tsx    ← OT + tareas + 3D
│   └── SelloEntrega.tsx       ← acta + garantía
Los sellos de Comercial y Producción usan el mismo ProjectCanvas. La diferencia es qué sellos son visibles según el rol y en qué fase está el proyecto.