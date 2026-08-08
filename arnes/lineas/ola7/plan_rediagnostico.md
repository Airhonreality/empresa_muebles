# Plan de Rediagnóstico del Arnés

**Fecha:** 2026-08-08 · **Estado:** SUPERADO — la reestructuración física se ejecutó (2026-08-08), pero con un árbol distinto al de este documento (ver §0.c) · **Tipo:** mutacion_arnes (histórica) · **Riesgo:** máximo  
**Precondición:** NO se ejecuta ningún bucle sin aprobación explícita de este plan por el Supervisor.

## 0.c Nota de cierre (2026-08-08) — la matryoshka real no es la de §1

El árbol matryoshka de este documento (§1: capas por antigüedad — arranque/contrato vivo/ledger/herramientas/archivo) **no es el que se ejecutó.** En la misma sesión, el Supervisor lo reemplazó por un árbol organizado por **rol epistémico y línea de trabajo**, no por profundidad de carpeta: `arnes/nucleo/` (verdad de negocio compartida) + `arnes/lineas/<linea>/` (cada línea con su propio progreso, pantallas/tecnico/archivo si aplica). Ver `arnes/lineas/REGISTRO_LINEAS.md` para el árbol real y `arnes/INDEX.md` para la navegación vigente.

Se ejecutó sin subagentes (confirma la crítica de §0.b: era un movimiento de archivos + reemplazo de referencias, mecánico). BUCLE 1-6 de este documento quedan sin ejecutar y sin objeto — el diccionario canónico y las auditorías que proponían ya no aplican a una estructura que cambió de forma.

## 0.b Decisión de diferimiento (2026-08-08)

El Supervisor revisó este plan en el momento exacto en que el cleanup puntual de `plan_alineacion.md` §3 Fase 1 (más los hallazgos F-01/DC-1/DC-2 de `plan_estructura_sitio_publico.md`) se estaba ejecutando a mano. Auditoría del Orquestador:

- **Se solapa con `plan_alineacion.md`**, que ya tiene el diagnóstico exacto (`archivo:línea`) de todo lo que BUCLE 1-4 se propone redescubrir. BUCLE 1 (diccionario canónico) ya existe como semilla en `plan_alineacion.md` §7.
- **Las 7 dimensiones D1/D3/D4/D5/D6/D7/D8 de BUCLE 2-4 son 100% mecánicas** (regex, `Test-Path`, conteo, parseo JSON) — no requieren razonamiento de un agente, ni siquiera uno liviano. Ejecutarlas como subagentes gasta tokens/latencia sin ganar precisión frente a un script directo.
- **BUCLE 0 (reestructuración matryoshka)** es una decisión de arquitectura de información separada del problema de referencias desalineadas — resuelve bloat/discoverability, no exactitud.
- El cleanup puntual (~20 líneas, ~10 archivos, ya diagnosticadas) se ejecutó directo, sin agentes, en la misma sesión (`estado.md`, `INDEX.md`, `plan_ola7_maestro.md`, `PLANTILLA_HARDENING.md`, `glosario_h07.md`, `disenio_f3_cronograma_gates.md`, `plan_f5.md`, `plan_t-080.md`, `disenio_modulo_espacio.md`, `plan_f7.md`, `destilacion_f3_publico.md`, `AGENTS.md`).

**Condición de reapertura:** este plan se retoma como iniciativa propia (no empaquetada con un cleanup de referencias) cuando (a) el conteo de archivos en `arnes/` vuelva a ser un bloqueador real para arrancar sesión — no solo "es mucho", y (b) BUCLE 2-4 se rediseñen como scripts (`rg`/PowerShell) en vez de subagentes, reservando LLM solo para B5.3 (clasificación NL) y la regla anti-falso-positivo. BUCLE 0 puede aprobarse independientemente si el Supervisor decide que la reestructuración física vale la pena por sí sola.

---

## 0. Axiomas

1. **Matryoshka**: más cerca del root = más reciente y accionable. Más profundo = más histórico y referencial.
2. **250 archivos es demasiado**. La disciplina de `ARNES_AGENTICO.md` §9 obliga a podar, no acumular. La estructura actual viola esa regla.
3. **Ningún bucle escribe código de aplicación**. Solo reestructura el arnés (docs) y ejecuta verificaciones de solo lectura.
4. **Cada bucle tiene contrato de entrada y salida**. Sin salida verificada, no avanza al siguiente.

---

## 1. Estructura matryoshka objetivo

La salida del BUCLE 0. Todo archivo que un agente necesita al arrancar está a ≤2 niveles del root:

```
arnes/
│
│  ←── CAPA 1: Arranque (3 archivos, leídos en cada sesión) ──→
├── estado.md                          ← Progreso real de HOY
├── INDEX.md                           ← Qué leer según qué necesitas
├── MODELOS.md                         ← Stack de modelos free
│
│  ←── CAPA 2: Contrato vivo (planes/, lo que se está diseñando AHORA) ──→
├── REGISTRO_DE_ENTIDADES.md           ← Canon de schema (~60 entidades)
├── ESTRUCTURA_OUTPUT_PRE_CODIGO.md    ← Gate de salida a código
│
├── planes/
│   ├── plan_ola7_maestro.md           ← Contrato maestro F0–F9
│   ├── plan_alineacion.md             ← Doctor del arnés
│   ├── plan_rediagnostico.md          ← Este documento
│   │
│   │  ←── Plantillas (cómo se diseña cada tipo de fase) ──→
│   ├── PLANTILLA_PANTALLA.md          ← F2–F7
│   ├── PLANTILLA_HARDENING.md         ← F8
│   ├── PLANTILLA_QA.md                ← F9
│   │
│   │  ←── Planes de fase (lo próximo a ejecutar en V3) ──→
│   ├── plan_f4.md                     ← Compras
│   ├── plan_f5.md                     ← Taller + Calidad
│   ├── plan_f6.md                     ← Finanzas
│   ├── plan_f7.md                     ← Sitio público
│   │
│   │  ←── Planes de tarea (F0–F3 activos) ──→
│   ├── plan_t-074 — F0 Cimientos.md
│   ├── plan_t-075 — F1 Catálogos.md
│   ├── plan_t-080 — F3 Cronograma.md
│   │
│   │  ←── Diseños de pantalla ──→
│   ├── disenio_P01 — Kanban Comercial.md
│   ├── disenio_P02 — Nueva Cotización.md
│   ├── disenio_P03 — Detalle Solo Lectura.md
│   ├── disenio_P04 — Cotizador.md
│   ├── disenio_P16 — Fila del Taller.md
│   ├── disenio_P17 — Calidad Gate.md
│   ├── disenio_P18 — Instalación.md
│   ├── disenio_P19 — Acta de Entrega.md
│   ├── disenio_P20 — Garantía.md
│   ├── disenio_P21 — Caja.md
│   ├── disenio_P22 — Obligaciones.md
│   ├── disenio_P23 — Cuentas de Cobro.md
│   ├── disenio_F02 — Tienda Web.md
│   ├── disenio_F03 — Portafolio.md
│   ├── disenio_F07 — Portal Cliente.md
│   ├── disenio_F08 — Propuesta Pública.md
│   ├── disenio_F3  — Cronograma y Gates.md
│   ├── disenio_DE  — Módulo por Espacio.md
│   │
│   │  ←── Soporte transversal ──→
│   ├── glosario_h07.md
│   └── m06_capa_tecnica_transversal.md
│
│  ←── CAPA 3: Ledger (tareas/, lo que YA se ejecutó) ──→
├── tareas/
│   ├── ESQUEMA_TAREA.md
│   └── t-001.json … t-101.json
│
│  ←── CAPA 4: Herramientas (tools/, verificaciones automatizables) ──→
├── tools/
│   └── LEEME.md
│
│  ←── CAPA 5: Archivo histórico (archivo/, cómo se llegó hasta acá) ──→
└── archivo/
    ├── LEEME.md                        ← Explica la matryoshka
    ├── ARNES_AGENTICO.md               ← Plantilla maestra del método
    ├── roles/                          ← Contratos de los 5 roles
    ├── diagnostico/                    ← Mapa del negocio, eventos, decisiones
    ├── pasadas/                        ← Auditorías D3, D4, define
    ├── trazabilidad/                   ← Trazabilidad punto-0 + cruce
    ├── trazabilidad_punto0/            ← Reportes de bucle
    ├── destilaciones/                  ← destilacion_cotizador, f3_publico
    ├── planes_historicos/              ← plan_arquitectura, convergencia, demanda, hygiene
    └── prompts/                        ← Prompts de subagentes L0..L8
```

### Reglas del árbol

| Regla | Fundamento |
|---|---|
| Un archivo en `archivo/` nunca se modifica | Registro histórico (ARNES_AGENTICO §2.C) |
| Solo `estado.md`, `INDEX.md`, `MODELOS.md` en root de `arnes/` | Capa 1 = arranque de sesión |
| `REGISTRO_DE_ENTIDADES.md` en root (no en subcarpeta) | Es el canon referenciado por todas las plantillas y diseños |
| Naming: `código — Nombre Natural.ext` | `disenio_P04 — Cotizador.md`, no `disenio_p04_cotizador.md` |
| Los IDs de tarea (t-001) no cambian | Es el identificador estable del ledger |
| Sin archivos sueltos en `arnes/` que no estén en este árbol | Podar es obligatorio |

---

## 2. Arquitectura de bucles

```
BUCLE 0 — Archivística (reestructura física del arnés)
  │ Precondición: commit limpio + worktree separado
  │ Output: árbol matryoshka aplicado; referencias cruzadas actualizadas
  │
  ├─→ BUCLE 1 — Diccionario canónico (fuente única de nombres)
  │     Precondición: BUCLE 0 verificado
  │     Output: DICCIONARIO_CANONICO.json + regex de extracción validado
  │
  ├─→ BUCLE 2 — Auditoría LIVE zona A (planes/ — 3 subagentes paralelo)
  │     Precondición: BUCLE 1 completado
  │     Output: H2A_planes_disenios.md, H2B_planes_fase.md, H2C_glosario_maestro.md
  │
  ├─→ BUCLE 3 — Auditoría LIVE zona B (root + tareas/ — 2 subagentes paralelo)
  │     Precondición: BUCLE 1 completado
  │     Output: H3A_root.md, H3B_tareas.md
  │
  ├─→ BUCLE 4 — Auditoría FROZEN (archivo/ — 1 subagente)
  │     Precondición: BUCLE 1 completado
  │     Output: H4_frozen.md (solo INFO, sin ERROR)
  │
  ├─→ BUCLE 5 — Cruce, deduplicación y clasificación (Orquestador)
  │     Precondición: BUCLES 2, 3, 4 completados
  │     Output: DIAGNOSTICO_REFERENCIAS.md
  │       ├── §A: Tareas NL (lenguaje natural — requieren agente/humano)
  │       └── §B: Tareas SCRIPT (reemplazo mecánico automatizable)
  │
  └─→ BUCLE 6 — QA independiente
        Precondición: BUCLE 5 completado
        Output: QA_REDIAGNOSTICO.md (pasa/no-pasa)
```

---

## 3. BUCLE 0 — Archivística

### Objetivo
Reestructurar físicamente el arnés según la matryoshka de §1. Este bucle no audita referencias — solo mueve y renombra archivos, y actualiza los punteros en docs vivos.

### Sub-bucles

```
B0.1 — Pre-vuelo
  ├── git stash / commit limpio
  ├── git worktree add ../empresa_muebles_archivistica dev
  └── Ejecutar TODO el bucle 0 en ese worktree

B0.2 — Movimiento masivo a archivo/
  ├── Mover todo diagnostico/ → archivo/diagnostico/
  │   EXCEPTO: REGISTRO_DE_ENTIDADES.md → arnes/ (root)
  ├── Mover roles/ → archivo/roles/
  ├── Mover trazabilidad/ → archivo/trazabilidad/
  ├── Mover ARNES_AGENTICO.md → archivo/ARNES_AGENTICO.md
  ├── Mover destilacion_*.md de planes/ → archivo/destilaciones/
  ├── Mover plan_arquitectura_destino.md, plan_convergencia_eslabones.md,
  │   plan_demanda.md, plan_hygiene_ciclo_h.md → archivo/planes_historicos/
  ├── Mover PLANTILLA_PLAN.md → archivo/planes_historicos/
  ├── Mover prompts/ → archivo/prompts/
  └── Crear archivo/LEEME.md + tools/LEEME.md

B0.3 — Renombrado de archivos activos
  ├── Aplicar estándar "código — Nombre Natural.md"
  └── Ver: tabla de renombres en §3.1

B0.4 — Actualización de referencias cruzadas (SCRIPT)
  ├── Para cada movimiento de carpeta: reemplazo masivo de rutas
  │   en todos los archivos LIVE (planes/, root, tareas/)
  │   Ej: "diagnostico/" → "archivo/diagnostico/" en todos los .md de planes/
  └── Script: rg -l "diagnostico/" arnes/planes/ arnes/estado.md arnes/INDEX.md
      arnes/tareas/ | % { (Get-Content $_) -replace "diagnostico/",
      "archivo/diagnostico/" | Set-Content $_ }

B0.5 — Actualización de referencias en prosa (NL)
  ├── INDEX.md — reescribir §3 (diagnostico/) → § referenciando archivo/diagnostico/
  ├── estado.md — actualizar referencias a rutas viejas
  ├── ESTRUCTURA_OUTPUT_PRE_CODIGO.md — actualizar árbol §2
  └── Cada plan_f*.md — actualizar referencias en secciones de fuentes

B0.6 — Verificación
  ├── rg "diagnostico/" arnes/planes/ arnes/estado.md arnes/INDEX.md
  │   arnes/REGISTRO_DE_ENTIDADES.md = 0 resultados en LIVE
  ├── rg "roles/" arnes/planes/ arnes/estado.md arnes/INDEX.md = 0 fuera de archivo/
  ├── INDEX.md lista todas las carpetas de capa 2-4 con sus archivos
  ├── git status — solo muestra cambios en arnes/ (cero en lib/, app/, components/)
  └── Conteo de archivos en arnes/ (root, sin subcarpetas) ≤ 6
```

### 3.1 Tabla de renombres (B0.3)

| Archivo actual | Nombre nuevo |
|---|---|
| `disenio_F02_tienda_web.md` | `disenio_F02 — Tienda Web.md` |
| `disenio_F03_portafolio_proyectos.md` | `disenio_F03 — Portafolio.md` |
| `disenio_F07_portal_cliente.md` | `disenio_F07 — Portal Cliente.md` |
| `disenio_F08_propuesta_publica.md` | `disenio_F08 — Propuesta Pública.md` |
| `disenio_f3_cronograma_gates.md` | `disenio_F3 — Cronograma y Gates.md` |
| `disenio_modulo_espacio.md` | `disenio_DE — Módulo por Espacio.md` |
| `disenio_p01_kanban_comercial.md` | `disenio_P01 — Kanban Comercial.md` |
| `disenio_p02_nueva_cotizacion.md` | `disenio_P02 — Nueva Cotización.md` |
| `disenio_p03_detalle_solo_lectura.md` | `disenio_P03 — Detalle Solo Lectura.md` |
| `disenio_p04_cotizador.md` | `disenio_P04 — Cotizador.md` |
| `disenio_P16_fila_taller.md` | `disenio_P16 — Fila del Taller.md` |
| `disenio_P17_calidad_gate.md` | `disenio_P17 — Calidad Gate.md` |
| `disenio_P18_instalacion.md` | `disenio_P18 — Instalación.md` |
| `disenio_P19_acta_entrega.md` | `disenio_P19 — Acta de Entrega.md` |
| `disenio_P20_garantia.md` | `disenio_P20 — Garantía.md` |
| `disenio_P21_caja.md` | `disenio_P21 — Caja.md` |
| `disenio_P22_obligaciones.md` | `disenio_P22 — Obligaciones.md` |
| `disenio_P23_cuentas_cobro.md` | `disenio_P23 — Cuentas de Cobro.md` |
| `plan_t-074.md` | `plan_t-074 — F0 Cimientos.md` |
| `plan_t-075.md` | `plan_t-075 — F1 Catálogos.md` |
| `plan_t-080.md` | `plan_t-080 — F3 Cronograma.md` |

### 3.2 Template de LEEME.md para archivo/

```markdown
# Archivo histórico del arnés

Todo lo que está en esta carpeta es **registro histórico**.
No se modifica. Explica cómo se llegó a las decisiones actuales,
no cuál es el estado actual.

Para el estado actual: leé `arnes/estado.md`.
Para el contrato vivo: leé `arnes/planes/`.
```

---

## 4. BUCLE 1 — Diccionario Canónico

### Objetivo
Construir la fuente única de todos los nombres válidos del sistema: schemas, eventos, pantallas, fases, tareas. Este diccionario es el input de los bucles 2-4.

### Fuentes de extracción

| Fuente | Qué aporta | Validación |
|---|---|---|
| `REGISTRO_DE_ENTIDADES.md` §2–§12 | Tablas canónicas, columnas | `grep '^\|.*`.*\|'` extrae nombres de tabla |
| `REGISTRO_DE_ENTIDADES.md` §11 | Mapa de renames (columna "Renombrado desde") | Cada par {viejo → nuevo} se registra |
| `nota_migracion_inteligente_campos.md` | ~14 renames de catálogo (precio_directo→valor_unitario, etc.) | Se incorporan al diccionario |
| `plan_f6.md` §4 | `check_15_dias` → `check_produccion` | Decisión documentada |
| `diamante2_define_eventos.md` | E-01..E-61 canónicos | Set completo de 61 eventos |
| `disenio_*.md` (nombres de archivo) | P-01..P-26, F-01..F-08 canónicos | Set extraído del prefijo de archivo |
| `arnes/tareas/t-*.json` (IDs) | t-001..t-101 | Set extraído del campo `id` |
| `plan_ola7_maestro.md` | F0..F9 canónicos | Fases del plan maestro |

### Formato de salida: `DICCIONARIO_CANONICO.json`

```json
{
  "schemas": {
    "tablas": ["proyectos", "espacio_variantes", "items_variante", "..."],
    "deprecated": {
      "check_15_dias":   { "canon": "check_produccion",    "source": "plan_f6.md §4" },
      "modulos_armado":  { "canon": "modulos",             "source": "D-2026-08-07-C" },
      "veredictos_calidad": { "canon": "verificaciones",   "source": "REGISTRO" },
      "productos_acabados": { "canon": "catalogo_acabados","source": "FLAG-4" },
      "precio_directo":  { "canon": "valor_unitario",      "source": "nota_migracion_inteligente_campos.md" },
      "precio_publico":  { "canon": "valor_tienda",        "source": "nota_migracion_inteligente_campos.md" },
      "stock_actual":    { "canon": "inventario_disponible","source": "nota_migracion_inteligente_campos.md" },
      "publicado_web":   { "canon": "visible_en_tienda",   "source": "nota_migracion_inteligente_campos.md" },
      "categoria_comercial": { "canon": "categoria_tienda","source": "nota_migracion_inteligente_campos.md" }
    },
    "validos_sin_rename": {
      "audit_logs": "Tabla canónica en REGISTRO y schema.ts. No es rename."
    }
  },
  "eventos": {
    "set": ["E-01","E-02","E-03","...","E-61"],
    "source": "diamante2_define_eventos.md"
  },
  "pantallas": {
    "admin":  ["P-01","P-02","P-03","P-04","P-06","P-07","P-08","P-09","P-10","P-11","P-12","P-13","P-14","P-15","P-16","P-17","P-18","P-19","P-20","P-21","P-22","P-23","P-24","P-25","P-26"],
    "frontstage": ["F-01","F-02","F-03","F-07","F-08"],
    "diferido": ["F-04","F-05","F-06","P-32","P-33"]
  },
  "fases": ["F0","F1","F2","F3","F4","F5","F6","F7","F8","F9"],
  "tareas": {
    "set": ["t-001","t-002","...","t-101"],
    "source_dir": "arnes/tareas/"
  },
  "regex_extraccion": {
    "token_snake": "[a-z][a-z0-9_]*[a-z0-9]",
    "codigo_evento": "E-\\d{1,2}",
    "codigo_pantalla": "[PF]-\\d{2}",
    "codigo_tarea": "t-\\d{3}",
    "codigo_fase": "F\\d",
    "backtick_ref": "`[^`]+`"
  }
}
```

### Verificación del BUCLE 1

| # | Verificación | Comando |
|---|---|---|
| V1.1 | Toda entrada `deprecated` tiene respaldo en al menos una fuente documentada | `grep` del `source` en el archivo físico |
| V1.2 | Toda tabla en `schemas.tablas` aparece en REGISTRO §2–§12 | Cruce script contra REGISTRO |
| V1.3 | `eventos.set` tiene exactamente 61 entradas | `count == 61` |
| V1.4 | `pantallas.admin + frontstage` = conteo de archivos `disenio_P*.md` + `disenio_F*.md` | Conteo de archivos |
| V1.5 | `tareas.set` = cantidad de archivos `t-*.json` en `arnes/tareas/` | `Get-ChildItem arnes/tareas/t-*.json \| Measure-Object` |
| V1.6 | El `regex_extraccion.token_snake` captura todos los nombres de tabla en schemas.tablas | Test contra muestra de REGISTRO |

---

## 5. BUCLES 2 y 3 — Auditoría LIVE

### Estrategia de subagentes

5 subagentes `explore` en paralelo (solo lectura, riesgo bajo). Cada uno recibe su franja de archivos + el diccionario canónico + el regex de extracción. Cadena de serialización verificada: ningún par de agentes comparte archivos.

| Agente | Franja | Archivos | Dimensiones | Output |
|---|---|---|---|---|
| **A2A** | `lineas/ola7/pantallas/disenio_*.md` | ~19 | D1, D3, D4, D5 | `H2A_disenios.md` |
| **A2B** | `planes/plan_f*.md`, `plan_t-*.md`, `plan_ola7_maestro.md`, `plan_alineacion.md`, `plan_rediagnostico.md` | ~10 | D1, D3, D4, D5 | `H2B_planes_fase.md` |
| **A2C** | `planes/PLANTILLA_*.md`, `nucleo/glosario_h07.md`, `planes/m06_*.md` | ~6 | D1, D3, D4, D5 | `H2C_plantillas_glosario.md` |
| **A3A** | `arnes/estado.md`, `INDEX.md`, `MODELOS.md`, `REGISTRO_DE_ENTIDADES.md`, `ESTRUCTURA_OUTPUT_PRE_CODIGO.md`, `AGENTS.md` (raíz) | ~6 | D1, D3, D4, D5 | `H3A_root.md` |
| **A3B** | `arnes/tareas/t-*.json`, `ESQUEMA_TAREA.md` | ~92 | D1, D7, D8 | `H3B_tareas.md` |

### Dimensiones auditadas (hereda plan_alineacion.md §8.2)

| Dimensión | Regla | Severidad en LIVE | Ejemplo de hallazgo |
|---|---|---|---|
| **D1** | Token `snake_case` en backticks matchea `schemas.deprecated` | **ERROR** | `` `check_15_dias` `` → debe ser `` `check_produccion` `` |
| **D3** | Token `snake_case` en backticks NO existe en `schemas.tablas` ni en `deprecated` | **ERROR** | `` `tabla_que_no_existe` `` → símbolo fantasma |
| **D4** | Ruta a `.md` o `.json` en el texto no resuelve con `Test-Path` | **ERROR** | "ver `arnes/diagnostico/logica.md`" → `archivo/diagnostico/logica.md` existe? |
| **D5** | Código E-XX, P-XX, F-XX, t-NNN, F-N no existe en el diccionario | **ERROR** | "E-99" → no está en eventos.set |
| **D6** | Diseño/plan existe pero ningún otro archivo LIVE lo referencia | **WARN** | `disenio_P99.md` existe pero huérfano |
| **D7** | `plan_ref` en tarea JSON apunta a archivo inexistente | **ERROR** | `"plan_ref": "arnes/planes/plan_t-999.md"` → no existe |
| **D8** | JSON no parseable (error de sintaxis) | **ERROR** | `t-008.json` → `ConvertFrom-Json` falla |

### Formato de salida de cada agente

Tabla markdown con columnas fijas:

```
| # | Archivo:Línea | Token | Categoría | Severidad | Canónico | Tipo |
|---|---------------|-------|-----------|-----------|----------|------|
| 1 | disenio_P04.md:42 | check_15_dias | D1-rename | ERROR | check_produccion | SCRIPT |
| 2 | estado.md:36 | F6 | D5-codigo | ERROR | F8 | NL |
```

**Columna Tipo:** `SCRIPT` (reemplazo mecánico de string) o `NL` (requiere reescritura humana/agente).

### Reglas anti-falso-positivo

1. Si el token está en un bloque de código ``` o `inline` que es explícitamente un ejemplo de "nombre viejo", el agente marca **WARN** en vez de **ERROR**.
2. Si el archivo está en zona FROZEN (archivo/), el agente marca **INFO** en vez de **ERROR**.
3. Si el token `snake_case` es parte de una URL, path de archivo, o comando de terminal, se excluye (no es un símbolo de schema).

### Prompt canónico de subagente (template)

```
Rol: explore (solo lectura, no escribas archivos)
Zona: lineas/ola7/pantallas/disenio_*.md (19 archivos)
Diccionario: arnes/DICCIONARIO_CANONICO.json (adjunto abajo)
Regex de extracción: <regex del diccionario>

Para cada archivo en tu franja:
1. Extraé todo token `snake_case` en backticks con el regex.
2. Clasificalo contra schemas.tablas y schemas.deprecated del diccionario.
3. Extraé todo código E-XX, P-XX, F-XX, t-NNN, F-N.
4. Clasificalo contra eventos.set, pantallas, tareas.set, fases del diccionario.
5. Extraé toda referencia a archivo .md o .json en el texto.
6. Verificá con la regla: ¿el path apunta a un archivo que existe?
7. Para JSON en tareas/: intentá parsear; si falla, registrá D8-parse_error.

Output: tabla con columnas [ # | Archivo:Línea | Token | Categoría | Severidad | Canónico | Tipo ]
Guardá el output en: arnes/planes/H2A_disenios.md

NO inventes nombres canónicos. Todo canónico debe estar en el diccionario.
Si un token no existe en el diccionario, marcá D3-simbolo_fantasma con canónico = "?".
```

---

## 6. BUCLE 4 — Auditoría FROZEN

### Objetivo

Escanear `archivo/` (~160 archivos) buscando tokens deprecados para registro de trazabilidad. Cero correcciones. Solo conteo.

### Subagente único

| Agente | Franja | Archivos | Output |
|---|---|---|---|
| **A4** | `archivo/**/*.md` + `archivo/**/*.json` | ~160 | `H4_frozen.md` |

### Reglas FROZEN

- Toda coincidencia es severidad **INFO** (nunca ERROR, nunca WARN)
- No se sugiere canónico (columna "Canónico" = "—")
- Columna "Tipo" = "—" (no se corrigen)
- El output solo lista conteos por archivo, no línea por línea (para no generar un reporte de 5000 filas)

### Formato de salida

```
| # | Archivo | Tokens deprecados encontrados | Conteo |
|---|---------|-------------------------------|--------|
| 1 | archivo/pasadas/d3_schema_consolidado.md | check_15_dias, modulos_armado | 12 |
| 2 | archivo/nucleo/logica_de_negocio.md | modulos_armado | 3 |
```

---

## 7. BUCLE 5 — Cruce, deduplicación y clasificación

### Input
- `H2A_disenios.md`, `H2B_planes_fase.md`, `H2C_plantillas_glosario.md`
- `H3A_root.md`, `H3B_tareas.md`
- `H4_frozen.md`

### Sub-bucles del Orquestador

```
B5.1 — Merge
  ├── Concatenar todos los H*.md en una tabla única
  └── Columnas unificadas: [Origen | Archivo:Línea | Token | Cat | Sev | Canónico | Tipo]

B5.2 — Deduplicación
  ├── Mismo (Archivo:Línea, Token) en dos agentes → conservar el de mayor severidad
  └── Regla: ERROR > WARN > INFO

B5.3 — Clasificación NL vs SCRIPT
  ├── SCRIPT: el token viejo → canónico es un reemplazo 1:1 de string
  │   (mismo string en múltiples archivos, cero ambigüedad semántica)
  │   Ej: check_15_dias → check_produccion en 4 archivos
  ├── NL: el cambio requiere entender contexto, reescribir prosa, o decidir
  │   Ej: "Ejecutar el bucle de diseño F6" → requiere entender que F6 ya pasó
  └── Regla: si el token está en una celda de tabla markdown → NL (puede requerir
      ajustar ancho de columna). Si está en prosa corrida → NL. Solo si es un
      identificador aislado en backticks → SCRIPT.

B5.4 — Agrupación por lote de ejecución
  ├── Agrupar tareas SCRIPT que tocan los mismos archivos (evitar colisión)
  ├── Serializar tareas NL por prioridad (ERROR primero, WARN después)
  └── Output: dos listas de tareas ordenadas y sin colisiones
```

### Formato de salida: `DIAGNOSTICO_REFERENCIAS.md`

```markdown
# Diagnóstico de Referencias — Rediagnóstico 100%

**Fecha:** 2026-08-08
**Bucles ejecutados:** B0-B5
**Archivos auditados:** N (LIVE) + M (FROZEN) = TOTAL
**Hallazgos totales:** X (ERROR: E, WARN: W, INFO: I)

## A. Tareas de lenguaje natural (NL)

| # | Archivo:Línea | Hallazgo | Propuesta | Severidad |
|---|---------------|----------|-----------|-----------|
| NL-001 | estado.md:36 | "Ejecutar el bucle de diseño F6" | "Abrir el bucle F8 (hardening)" | ERROR |
| NL-002 | ... | ... | ... | ... |

## B. Tareas de script automatizado (SCRIPT)

| # | Token viejo | Token nuevo | Archivos | Conteo |
|---|-------------|-------------|----------|--------|
| SC-001 | check_15_dias | check_produccion | plan_ola7_maestro.md, disenio_F3.md, glosario_h07.md, plan_t-080.md | 4 |
| SC-002 | modulos_armado | modulos | plan_ola7_maestro.md, disenio_F3.md, plan_f5.md, glosario_h07.md | 4 |
```

---

## 8. BUCLE 6 — QA independiente

### Ejecutor vs Verificador

- **Ejecutores**: subagentes explore (A2A, A2B, A2C, A3A, A3B, A4) + Orquestador (BUCLE 5)
- **Verificador**: QA (identidad distinta — ARNES_AGENTICO §3.4)

### Métodos de verificación

| # | Método | Procedimiento | Evidencia |
|---|---|---|---|
| QA1 | **Re-ejecución de regex** | QA corre el mismo regex del diccionario sobre 100% de hallazgos ERROR | Conteo de matches del regex debe coincidir con el conteo del agente |
| QA2 | **Muestreo línea cruda** | QA abre el archivo físico en la línea exacta de cada ERROR y verifica que el token está ahí | Captura de `rg -n "token" archivo` |
| QA3 | **Test-Path independiente** | Para D4: QA ejecuta `Test-Path` sobre cada ruta reportada | Output de PowerShell |
| QA4 | **Parseo JSON del ledger** | Para D8: QA ejecuta `ConvertFrom-Json` sobre cada t-*.json | Lista de archivos con error + stack trace |
| QA5 | **Validación del diccionario** | QA verifica que todo "canónico" sugerido existe en DICCIONARIO_CANONICO.json | Cero canónicos inventados |
| QA6 | **Clasificación LIVE/FROZEN** | QA verifica que ningún hallazgo en archivo/ tiene severidad ERROR o WARN | `grep "archivo/" DIAGNOSTICO_REFERENCIAS.md` → solo INFO |
| QA7 | **Cobertura** | QA verifica que el conteo de archivos auditados = total de archivos en la franja | `Get-ChildItem` count vs reporte |

### Veredicto

```
QA_REDIAGNOSTICO.md:
  QA1 (regex): PASS/FAIL — <conteo>
  QA2 (línea cruda): PASS/FAIL — <N errores de M muestreados>
  QA3 (Test-Path): PASS/FAIL
  QA4 (JSON parse): PASS/FAIL — <N archivos corruptos>
  QA5 (diccionario): PASS/FAIL
  QA6 (FROZEN): PASS/FAIL
  QA7 (cobertura): PASS/FAIL — <N auditados de M totales>

  Veredicto: APROBADO / RECHAZADO
  Si RECHAZADO: reabrir bucle(s) [lista]
```

---

## 9. Checklist de aprobación del Supervisor

Antes de ejecutar cualquier bucle:

- [ ] **Plan completo revisado** — los 6 bucles están diseñados con entrada/salida/verificación
- [ ] **Estructura matryoshka aprobada** — el árbol de §1 es la estructura final deseada
- [ ] **Nombres de archivo aprobados** — el estándar "código — Nombre Natural.md" es el definitivo
- [ ] **Worktree separado confirmado** — BUCLE 0 corre en `../empresa_muebles_archivistica`, no en el working tree principal
- [ ] **Backup listo** — `git stash` o commit limpio antes de BUCLE 0
- [ ] **Subagentes autorizados** — 6 subagentes explore (solo lectura, riesgo bajo)
- [ ] **Formato de salida aprobado** — DIAGNOSTICO_REFERENCIAS.md con listas NL + SCRIPT

---

## 10. Nota de autolimitación

Este plan está en fase de **diseño**. NO se ejecuta ningún bucle sin que el Supervisor marque explícitamente el checklist §9. La estructura matryoshka, los renombres y la arquitectura de subagentes quedan como propuesta hasta esa aprobación.
