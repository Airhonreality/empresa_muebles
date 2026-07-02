# 🔬 Cruce Axiomático: Elementos Interactivos × Schemas × Zaps × Entropía

Auditoría exhaustiva que cruza **cada elemento interactivo** descrito en los diseñoVs de detalle contra el **árbol de schemas** y **árbol de zaps** existentes, identificando brechas de datos, zaps faltantes, y vectores de entropía.

Fuentes cruzadas:
- [DISENO_DETALLE_MODULO_PRODUCCION.md](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/storage/fork_doc/DISENO_DETALLE_MODULO_PRODUCCION.md)
- [DISENO_DETALLE_CANVAS.md](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/storage/fork_doc/DISENO_DETALLE_CANVAS.md)
- [MAPA_MODULOS_Y_AUXILIARES_ERP.md](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/storage/fork_doc/MAPA_MODULOS_Y_AUXILIARES_ERP.md)
- [arbol_de_schemas.md](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/storage/progreso/arbol_de_schemas.md)
- [arbol_de_zaps.md](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/storage/progreso/arbol_de_zaps.md)
- [arbol_de_rutas.md](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/storage/progreso/arbol_de_rutas.md)
- [arbol_de_modulos.md](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone/storage/progreso/arbol_de_modulos.md)

---

## 📊 1. Matriz de Cruce: Elemento Interactivo → Schema → Zap

### A. Ficha Técnica de Producción (`DISENO_DETALLE_MODULO_PRODUCCION.md`)

| # | Elemento Interactivo | Schema Requerido | ¿Schema Existe? | Zap Requerido | ¿Zap Existe? | Brecha |
|---|---|---|---|---|---|---|
| 1 | **Header: Código OT y Nombre Proyecto** | `ordenes_trabajo.codigo_orden` + `proyectos.nombre_proyecto` | ✅ Sí | Lectura directa `/api/vault` | N/A | — |
| 2 | **Header: Nombre Cliente** | `clientes.nombre` (vía `proyectos.cliente_id`) | ✅ Sí | Lectura relacional | N/A | — |
| 3 | **Header: Semáforo Suministros** | `items_variante` + `productos_catalogo.stock_actual` | ✅ Sí | Lectura comparativa | N/A | — |
| 4 | **Header: Dirección de Obra [Copy]** | `proyectos.direccion_obra` | ✅ Sí | `navigator.clipboard` (browser) | N/A | — |
| 5 | **Header: Fecha de Entrega** | `ordenes_trabajo.fecha_entrega` | ✅ Sí | Lectura directa | N/A | — |
| 6 | **Header: Selector de Estado OT** | `ordenes_trabajo.estado` | ✅ Sí | Escritura directa `/api/vault` | N/A | — |
| 7 | **P1: Botón "Ver Despiece 3D"** | `productos_catalogo.modelo_3d` | ✅ Sí | Lectura 3D (Three.js) | N/A | — |
| 8 | **P1: Selector de Espacios** | `espacio_variantes` (filtrado `proyecto_id`) | ✅ Sí | Lectura relacional | N/A | — |
| 9 | **P1: Grid Sheets - Cols Lectura** | `items_variante` → `productos_catalogo.descripcion`, `.sku` | ✅ Sí | Lectura relacional | N/A | — |
| 10 | **P1: Col "Notas de Compra"** | `items_variante.notas_compra` | ⚠️ **NO EXISTE** | Escritura `/api/vault` | N/A | 🚩 **Agregar campo `notas_compra` a schema `items_variante`** |
| 11 | **P1: Col "Anular" (Checkbox)** | `items_variante.anulado` | ⚠️ **NO EXISTE** | Escritura `/api/vault` | N/A | 🚩 **Agregar campo `anulado` a schema `items_variante`** |
| 12 | **P1: "Agregar Ítem Fabricación"** | `items_variante` (nuevo registro) + `productos_catalogo` | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 13 | **P1: Textarea notas_markdown** | `espacio_variantes.notas_markdown` | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 14 | **P1: Botón "Generar Orden de Compra"** | `items_variante` → `compras_materiales` → `obligaciones_pendientes` | ✅ Sí | `zap_generar_orden_compra` | ❌ **NO EXISTE** | 🚩 **Crear zap** |
| 15 | **P1: Flag `compra_generada`** | `items_variante.compra_generada` | ⚠️ **NO EXISTE** | Escritura masiva en Zap | N/A | 🚩 **Agregar campo `compra_generada` a schema `items_variante`** |
| 16 | **P2: Lista tareas pendientes** | `tareas_produccion` (filtrado `orden_trabajo_id`) | ✅ Sí | Lectura relacional | N/A | — |
| 17 | **P2: Botón "Iniciar/Reactivar"** | `tareas_produccion.estado → 'en_progreso'` | ✅ Sí | Escritura directa | N/A | — |
| 18 | **P2: Botón "Pausar"** | `tareas_produccion.estado → 'pausada'` | ✅ Sí | `pausar_tarea` | ✅ Sí | — |
| 19 | **P2: Botón "Finalizar"** | `tareas_produccion.estado → 'completada'` | ✅ Sí | `finalizar_tarea` | ✅ Sí | — |
| 20 | **P2: Select Asignación Operario** | `tareas_produccion.operario_id` → `usuarios_equipo` | ✅ Sí | Escritura directa | N/A | — |
| 21 | **P2: Input "Agregar Tarea Rápida"** | `tareas_produccion` (nuevo registro) | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 22 | **P3: Apoyo Técnico (Fotos)** | `apoyo_tecnico` (filtrado `proyecto_id`) | ✅ Sí | Lectura + escritura directa | N/A | — |

---

### B. Canvas de Filas - Producción (`DISENO_DETALLE_CANVAS.md`)

| # | Elemento Interactivo | Schema Requerido | ¿Schema Existe? | Zap Requerido | ¿Zap Existe? | Brecha |
|---|---|---|---|---|---|---|
| 23 | **Acordeón colapsable por Etapas** | `ordenes_trabajo.estado` (agrupación) | ✅ Sí | Lógica UI local | N/A | — |
| 24 | **Fila: Código OT + Proyecto** | `ordenes_trabajo.codigo_orden` + `proyectos.nombre_proyecto` | ✅ Sí | Lectura relacional | N/A | — |
| 25 | **Fila: Cliente** | `clientes.nombre` (vía `proyectos.cliente_id`) | ✅ Sí | Lectura relacional | N/A | — |
| 26 | **Fila: Fecha Entrega** | `ordenes_trabajo.fecha_entrega` | ✅ Sí | Lectura directa | N/A | — |
| 27 | **Fila: Checkbox Tarea In Situ (×2)** | `tareas_produccion.estado → 'completada'` | ✅ Sí | `finalizar_tarea` o escritura directa | ✅ Sí | — |
| 28 | **Fila: Barra Progreso** | `tareas_produccion` (cálculo local completadas/total) | ✅ Sí | Cálculo frontend | N/A | — |
| 29 | **Botón "Iniciar Fabricación"** | `ordenes_trabajo.estado → 'en_proceso'` | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 30 | **Botón "Iniciar Instalación"** | `ordenes_trabajo.estado → 'instalacion'` | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 31 | **Botón "Completar Entrega"** | `ordenes_trabajo.estado → 'entregada'` | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 32 | **Botón "Ficha Técnica" (Sheet lateral)** | Apertura de `ProjectDetails` | ✅ Sí | Lógica UI local | N/A | — |

---

### C. Canvas de Filas - Comercial (`DISENO_DETALLE_CANVAS.md`)

| # | Elemento Interactivo | Schema Requerido | ¿Schema Existe? | Zap Requerido | ¿Zap Existe? | Brecha |
|---|---|---|---|---|---|---|
| 33 | **Fila: Proyecto / Cliente** | `proyectos` + `clientes` | ✅ Sí | Lectura relacional | N/A | — |
| 34 | **Botón "Ver Cotización"** | Navegación a `/app/quoting/:id` | ✅ Sí (ruta) | Lógica UI (router) | N/A | — |
| 35 | **Botón "Generar Contrato"** | `contratos` + `proyectos` + `clientes` | ✅ Sí | `generar_contrato` | ✅ Sí | — |
| 36 | **Botón "Activar Producción"** | `ordenes_trabajo` + `contratos` + `obligaciones_pendientes` | ✅ Sí | `zap_activar_produccion` | ✅ Sí | — |
| 37 | **Botón "Exportar PDF"** | `proyectos` + `clientes` + `espacio_variantes` + `items_variante` | ✅ Sí | `exportar_propuesta_pdf` | ✅ Sí | — |

---

### D. Módulos Auxiliares (`MAPA_MODULOS_Y_AUXILIARES_ERP.md`)

| # | Elemento Interactivo | Schema Requerido | ¿Schema Existe? | Zap Requerido | ¿Zap Existe? | Brecha |
|---|---|---|---|---|---|---|
| 38 | **Equipo: Tabla de Integrantes** | `usuarios_equipo` (listado) | ✅ Sí | Lectura `/api/vault` | N/A | — |
| 39 | **Equipo: Formulario Alta Operario** | `usuarios_equipo` (escritura: nombre, email, rol, costo_hora) | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 40 | **Equipo: Select Operario (Time Tracker)** | `usuarios_equipo` (lectura) | ✅ Sí | Lectura relacional | N/A | — |
| 41 | **Equipo: Select Orden de Trabajo** | `ordenes_trabajo` (lectura) | ✅ Sí | Lectura relacional | N/A | — |
| 42 | **Equipo: Select Tarea** | `tareas_produccion` (filtrado por OT) | ✅ Sí | Lectura relacional | N/A | — |
| 43 | **Equipo: Input Horas + Botón Registrar** | `registro_horas` (escritura) | ✅ Sí | `zap_registrar_horas_laborales` | ❌ **NO EXISTE** | 🚩 **Crear zap** |
| 44 | **Catálogo: Tabla de Insumos** | `productos_catalogo` (listado) | ✅ Sí | Lectura `/api/vault` | N/A | — |
| 45 | **Catálogo: Botón "+ Agregar Material"** | `productos_catalogo` (escritura) | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 46 | **Catálogo: Select Proveedor inline** | `proveedores` (lectura) + `productos_catalogo.proveedor` (escritura) | ✅ Sí | Escritura `/api/vault` | N/A | ⚠️ Campo `proveedor` es `string`, no FK. Ver Vector G. |
| 47 | **Proveedores: Tabla de Proveedores** | `proveedores` (listado) | ✅ Sí | Lectura `/api/vault` | N/A | — |
| 48 | **Proveedores: Formulario Alta** | `proveedores` (escritura: nombre, nit, etc.) | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 49 | **Perfil: Inputs datos personales** | `usuarios_equipo` (escritura: nombre, email) | ✅ Sí | Escritura `/api/vault` | N/A | ⚠️ No hay campo `telefono` ni `firma_url`. Ver Vector H. |
| 50 | **Perfil: Lienzo de Firma Digital** | `usuarios_equipo.firma_url` | ⚠️ **NO EXISTE** | Escritura `/api/vault` + upload imagen | N/A | 🚩 **Agregar campo `firma_url` a schema `usuarios_equipo`** |
| 51 | **Perfil: Botón Guardar Cambios** | `usuarios_equipo` (escritura) | ✅ Sí | Escritura `/api/vault` | N/A | — |
| 52 | **Conciliación: Lista Movimientos** | `movimientos_financieros` (filtrado `estado: 'pendiente'`) | ✅ Sí | Lectura `/api/vault` | N/A | — |
| 53 | **Conciliación: Lista Obligaciones** | `obligaciones_pendientes` (filtrado `estado: 'pendiente'`) | ✅ Sí | Lectura `/api/vault` | N/A | — |
| 54 | **Conciliación: Botón "Conciliar"** | `movimientos_financieros` + `obligaciones_pendientes` + `comprobantes_financieros` | ✅ Sí | `zap_conciliar_movimiento` | ❌ **NO EXISTE** | 🚩 **Crear zap** |
| 55 | **Actualización Costos Proyecto** | `proyectos` + `compras_materiales` + `registro_horas` | ✅ Sí | `zap_actualizar_costos_proyecto` | ❌ **NO EXISTE** | 🚩 **Crear zap** |

---

## 🗂️ 2. Resumen de Brechas Consolidado

### A. Campos Faltantes en Schemas (Requieren `agno` CLI o edición directa)

| Schema | Campo Faltante | Tipo | Propósito |
|---|---|---|---|
| `items_variante` | `notas_compra` | `string` | Permitir notas de taller sobre requerimientos de compra |
| `items_variante` | `anulado` | `boolean` | Flag para excluir ítems del requerimiento de compra |
| `items_variante` | `compra_generada` | `boolean` | Flag de idempotencia para evitar órdenes de compra duplicadas |
| `usuarios_equipo` | `firma_url` | `string` | URL de la imagen de firma digital del asesor |
| `usuarios_equipo` | `telefono` | `string` | Número de contacto del integrante |

### B. Zaps Faltantes (Requieren registro en `scripts.json`)

| Zap | Namespaces que Toca | Disparador UI | Módulo |
|---|---|---|---|
| `zap_generar_orden_compra` | `items_variante`, `productos_catalogo`, `proveedores`, `compras_materiales`, `obligaciones_pendientes` | Botón "Generar Orden de Compra" (Ficha P1) | Producción |
| `zap_registrar_horas_laborales` | `registro_horas`, `usuarios_equipo` | Botón "Registrar Tiempo" (EquipoDirectory) | Auxiliar |
| `zap_actualizar_costos_proyecto` | `proyectos`, `compras_materiales`, `registro_horas` | Invocable desde FinanzasShell o automáticamente | Auxiliar |
| `zap_conciliar_movimiento` | `movimientos_financieros`, `obligaciones_pendientes`, `comprobantes_financieros` | Botón "Conciliar Seleccionados" (Conciliación) | Finanzas |

### C. Rutas Faltantes en `page_routes.json`

| Ruta | Título | Bloque / Componente |
|---|---|---|
| `/app/equipo` | Gestión de Equipo | `type: equipo_directory` → `EquipoDirectory.tsx` |
| `/app/proveedores` | Proveedores | `type: proveedores_directory` → `ProveedoresDirectory.tsx` |
| `/app/perfil` | Mi Perfil | `type: user_profile` → `UserProfile.tsx` |

> **Nota:** La ruta `/app/catalog` ya existe y apunta a `productos_catalogo`. El `CatalogoManager.tsx` podría absorber esa ruta o convivir como pestaña.

---

## ⚠️ 3. Vectores de Entropía Anticipados

### 🚩 Vector D: Inconsistencia de FK `proveedor` en `productos_catalogo`
*   **Ubicación:** Schema `productos_catalogo`, campo `proveedor`.
*   **Problema:** El campo `proveedor` está declarado como `string` libre (no como FK `→ proveedores`). El Zap `zap_generar_orden_compra` necesita agrupar por `proveedor_id`, pero el campo actual almacena texto libre (ej: `"Masisa S.A."`), no un UUID que apunte a `proveedores.id`.
*   **Impacto:** La agrupación por proveedor fallará o será inconsistente porque no hay relación formal.
*   **Mitigación:** Agregar un campo `proveedor_id → proveedores` al schema `productos_catalogo`. Migrar los datos textuales existentes creando los registros correspondientes en `proveedores` y reemplazando los strings por UUIDs. El campo `proveedor` textual puede mantenerse como alias de lectura humana o eliminarse.

### 🚩 Vector E: Ausencia de campo `proyecto_id` en `obligaciones_pendientes`
*   **Ubicación:** Schema `obligaciones_pendientes`.
*   **Problema:** El diseño de detalle indica que al generar órdenes de compra, la obligación `por_pagar` resultante debe vincularse al proyecto de origen para trazabilidad. Sin embargo, `obligaciones_pendientes` no tiene campo `proyecto_id`.
*   **Impacto:** Al buscar las obligaciones de un proyecto específico desde Finanzas, no habrá forma de filtrar directamente. Se necesitaría recorrer compras → ítems → espacio_variantes → proyectos, lo cual es ineficiente.
*   **Mitigación:** Agregar `proyecto_id → proyectos` al schema `obligaciones_pendientes`. Es una FK opcional que el Zap `zap_generar_orden_compra` y `zap_activar_produccion` pueden poblar automáticamente.

### 🚩 Vector F: Ausencia de campo `contrato_id` en `obligaciones_pendientes`
*   **Ubicación:** Schema `obligaciones_pendientes`.
*   **Problema:** Similar al Vector E. Las obligaciones de tipo `por_cobrar` generadas por `zap_activar_produccion` derivan de un contrato (el modelo 50/25/25), pero no hay FK directa a `contratos`.
*   **Impacto:** No se puede trazar qué obligación pertenece a qué contrato sin hacer una resolución transitiva (`obligacion → proyecto → contrato`).
*   **Mitigación:** Agregar `contrato_id → contratos` al schema `obligaciones_pendientes`.

### 🚩 Vector G: `registro_horas` vs `registro_hours` (Nomenclatura Divergente)
*   **Ubicación:** `MAPA_MODULOS_Y_AUXILIARES_ERP.md` usa `registro_hours` / `DISENO_DETALLE_CANVAS.md` usa `registro_horas`.
*   **Problema:** El schema real en el árbol de schemas se llama **`registro_horas`** (español). El documento de módulos auxiliares lo referencia como `registro_hours` (inglés). Si el código se implementa con `registro_hours`, la invariante `block.context === schema.data.name === data_file_name` se romperá.
*   **Impacto:** El engine Agnostic no resolverá el bloque y se silenciará sin error visible.
*   **Mitigación:** Usar siempre `registro_horas` como nombre canónico. Corregir las referencias en el documento de módulos auxiliares.

### 🚩 Vector H: Schema `usuarios_equipo` sin campos de perfil completo
*   **Ubicación:** Schema `usuarios_equipo`.
*   **Problema:** El diseño del perfil requiere campos `telefono` y `firma_url` que no existen en el schema actual. Los campos actuales son: `nombre`, `email`, `rol`, `estado`, `descripcion_semantica`, `costo_hora`, `horas_estimadas_mes`.
*   **Impacto:** El formulario de perfil renderizará inputs para campos que el backend no reconoce ni persiste.
*   **Mitigación:** Agregar `telefono: string` y `firma_url: string` al schema `usuarios_equipo` vía `agno`.

### 🚩 Vector I: Zap `zap_activar_produccion` no genera obligaciones `por_cobrar`
*   **Ubicación:** `arbol_de_zaps.md` → `zap_activar_produccion`.
*   **Problema:** El documento `ERGONOMIA_COGNITIVA_CANVAS.md` establece que al activar producción se crean las 3 obligaciones financieras del modelo 50/25/25. Sin embargo, los namespaces declarados del Zap son: `contratos`, `ordenes_trabajo`, `proyectos`. No incluye `obligaciones_pendientes`.
*   **Impacto:** El Zap actual posiblemente no genera las obligaciones, o las genera sin estar declaradas en su metadata, lo que dificulta la trazabilidad de scripts.
*   **Mitigación:** Verificar el cuerpo del script. Si efectivamente genera obligaciones, agregar `obligaciones_pendientes` a los namespaces declarados. Si no las genera, implementar la lógica.

### 🚩 Vector J: Campo `compras_materiales.origen_proyecto` es `string`, no FK
*   **Ubicación:** Schema `compras_materiales`, campo `origen_proyecto`.
*   **Problema:** El campo `origen_proyecto` no está declarado como FK (`→ proyectos`). Es un campo libre.
*   **Impacto:** No se puede hacer JOIN relacional directo entre compras y proyectos. El Zap `zap_liquidar_utilidades_proyecto` podría fallar al calcular costos reales si la relación no es formal.
*   **Mitigación:** Convertir `origen_proyecto` en `origen_proyecto → proyectos` (FK formal).

---

## 📋 4. Checklist de Acciones Pre-Implementación

> **Estado: ✅ COMPLETADO** — Ejecutado el 2026-06-30T19:28 COT

### Schemas (CLI `agno`)
- [x] `items_variante`: Agregar `notas_compra`, `anulado`, `compra_generada` — ✅ Campos agregados, compilación exitosa (11 fields)
- [x] `productos_catalogo`: Agregar `proveedor_id → proveedores` (FK formal) — ✅ FK agregada (16 fields)
- [x] `obligaciones_pendientes`: Agregar `proyecto_id → proyectos`, `contrato_id → contratos` — ✅ FKs agregadas (12 fields)
- [x] `usuarios_equipo`: Agregar `telefono`, `firma_url` — ✅ Campos agregados (9 fields)
- [x] `compras_materiales`: Convertir `origen_proyecto` a FK `→ proyectos` — ✅ Convertido de `text` a `relation`

### Zaps (Nuevos scripts en `scripts.json`)
- [x] Crear `zap_generar_orden_compra` — ✅ Registrado con lógica de agrupación por proveedor e idempotencia
- [x] Crear `zap_registrar_horas_laborales` — ✅ Registrado con cálculo de costo/hora
- [x] Crear `zap_actualizar_costos_proyecto` — ✅ Registrado con suma de compras + mano de obra
- [x] Crear `zap_conciliar_movimiento` — ✅ Registrado con generación automática de comprobante
- [x] Verificar `zap_activar_produccion` — ✅ VERIFICADO: El zap SÍ genera las 3 obligaciones `por_cobrar` (50/25/25) con `proyecto_id` y `contrato_id`. Los namespaces en metadata no lo declaraban pero el body lo ejecuta correctamente.

### Rutas (Nuevas en `page_routes.json`)
- [x] Registrar `/app/equipo` — ✅ `type: equipo_directory`, context: `usuarios_equipo`
- [x] Registrar `/app/proveedores` — ✅ `type: proveedores_directory`, context: `proveedores`
- [x] Registrar `/app/perfil` — ✅ `type: user_profile`, context: `usuarios_equipo`

### Nomenclatura (Correcciones documentales)
- [x] Corregir `registro_hours` → `registro_horas` en `MAPA_MODULOS_Y_AUXILIARES_ERP.md` — ✅ Corregido

### Regeneración de Documentación
- [x] `agno docs` ejecutado — ✅ Árboles de schemas, zaps, rutas y módulos regenerados con los cambios reflejados
- [x] `agnostic:compile` ejecutado — ✅ Tipos TypeScript regenerados en `src/generated/agnostic-schemas.ts`
