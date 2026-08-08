# Plan de Tarea: t-075

**Título:** Grafo de catálogos (FLAG-4 + acabados/atributos + colores + composición) sobre la base `productos_catalogo`

**Fecha de creación:** 2026-08-05

---

## Objetivo

Definir y dejar registrada la estructura final del grafo de catálogos de F1 que integra, de forma holística y sin acoplamientos rígidos, la base `productos_catalogo` FLAG-4 (productos, insumos, herramientas), el subsistema de **marcas**, el de **fichas técnicas personalizadas por ítem**, el de **colores**, el de **acabados** (con su regla de compatibilidad material × acabado), y la **composición recursiva** de ítems. Es el snapshot de detalle de los determinantes de F1 que el Supervisor cerró el 2026-08-05 (bucle F1, mini-diamante M-02).

---

## Zona

**Zona afectada:** `datos`

---

## Tipo y Riesgo

**Tipo de tarea:** `logica_negocio`

**Riesgo calculado:** `alto`

**Frena al humano:** sí (checkpoint requerido — M-02 debe cerrarse antes de congelar t-075)

---

## Decisiones del Supervisor (cerradas el 2026-08-05)

1. **Marcas = opción B (tabla, no columna libre).** Las marcas son codependientes de proveedores/catálogos: `marcas(id, nombre UNIQUE, proveedor_id FK→proveedores, categoria)`. Una marca la representa un proveedor; una superficie nueva (ej. tablero biocomposite) hereda sus acabados por compatibilidad, no se acopla a mano.
2. **Ficha técnica NO es un schema ingenieril fijo.** Se descarta el `ficha_tecnica_json` con campos rígidos (`densidad_kg_m3`, `resistencia_flexion_mpa`, etc.). En su lugar: ficha del proveedor (URL/PDF + imagen) + **campos personalizados por ítem** guiados por un catálogo de definición (`campos_tecnicos_definicion`). Dinámico por tipo: electrodoméstico (voltage, tipo_apertura, capacidad), estufa (combustible induccion/gas, #quemadores), tablero (espesor, tipo_borde), etc.
3. **Acabados con jerarquía + regla de compatibilidad material × acabado.** `catalogos_acabados` (sistema) + `acabado_variantes` (niveles de brillo) + `producto_acabados` (M:N) + `acabado_compatibilidades` (la regla: un mesón solo acepta {mate, brillante}; la madera acepta poro abierto/poro lleno/poliuretano con sus variantes).
4. **Colores:** `catalogos_colores` + `producto_colores` (M:N, con precio diferencial).
5. **Composición unificada y recursiva (la serpiente que se muerde la cola).** Un insumo y un herraje son el MISMO schema `productos_catalogo` (ítems); un módulo/componente/producto es a la vez un proyecto que se anida como ítem dentro de otro. `composicion_json` usa una lista `items` (todos son filas de `productos_catalogo`) + `procesos` (labor, costea por tarifa hora, aparte) + `selecciones` (acabado/color). Cada ítem puede traer su propia `composicion` (recursión).
6. **`lote_minimo` / `lote_multiplo` activos en v1.** Son reglas de compra del proveedor (mínimo despachable + número envasado/múltiplo), usadas por los triggers de `punto_reorden` para sugerir OC válidas.
7. **Migración: `descripcion` legacy → `nombre` del nuevo schema** (NO a `descripcion_breve`). El `descripcion` legacy es el nombre del producto. `descripcion_breve` queda NULL o se deriva en Fase 4 (backfill).
8. **`proyecto_origen_id` → en `productos_tienda`** (exportar resultado de proyecto como producto; no todo proyecto es un producto).

---

## Esquema objetivo del grafo (snapshot)

### Nodo raíz
```
proveedores (existente)
   └── marcas (NUEVA)            -- id, nombre UNIQUE, proveedor_id FK, categoria
```

### Base + atributos
```
productos_catalogo (base FLAG-4) -- id, nombre, descripcion_breve, valor_unitario,
                                    unidad_medida, proveedor_id FK, activo,
                                    tipo_catalogo(enum 3)
   └── productos_atributos (1:1, NUEVA)
         -- catalogo_id PK FK, marca_id FK→marcas, modelo_fabric,
            ancho_mm/alto_mm/profundo_mm, peso_g, material,
            ficha_proveedor_url, ficha_proveedor_imagen_url,
            campos_personalizados_json (JSONB, según tipo)
   ├── productos_tienda (1:1)     -- + proyecto_origen_id FK, publicado_web (grafo propio)
   ├── materiales_insumos (1:1)   -- + codigo_interno, lote_minimo, lote_multiplo,
   │                                 punto_reorden, es_componente_terminado_json
   │                                 (INCLUYE herrajes — decisión C: sin tabla nueva)
   └── herramientas_maquinaria (1:1) -- + modelo, numero_serie, potencia_watts,
                                         estado_operativo, mantenimiento_*, repuestos_criticos_json
```

### Campos personalizados (definición por tipo)
```
campos_tecnicos_definicion (NUEVA)
   -- id, tipo_item, campo_clave, etiqueta, tipo_dato(number/text/enum),
      opciones_json, requerido, unidad
```

### Colores
```
catalogos_colores (NUEVA)         -- id, nombre, codigo, familia, url_muestra
producto_colores (M:N, NUEVA)     -- catalogo_id FK, color_id FK, precio_diferencial_pct
```

### Acabados (corazón del negocio)
```
catalogos_acabados (NUEVA)        -- id, nombre, familia(pintura/laminado/enchapado/laca/poliuretano)
acabado_variantes (NUEVA)         -- id, acabado_id FK, nombre(brillante/semi/mate/perlado)
producto_acabados (M:N, NUEVA)    -- catalogo_id FK, acabado_id FK, variante_id FK
acabado_compatibilidades (NUEVA)  -- material_id FK→materiales_insumos, acabado_id FK
   -- REGLA: mesón solo {mate, brillante}; madera → {poro_abierto, poro_lleno,
      semi_mate, brillante, semi_brillante, poliuretano+variantes, color}
```

### Composición (recursiva)
```
catalogo_componentes (NUEVA)      -- id, nombre, tipo, composicion_json(JSONB)
catalogo_procesos (NUEVA)         -- tiempo_estimado_minutos, requiere_proceso_ids[],
                                     herrajes_involucrados_json (costo = min/60 × tarifa_hora)
catalogo_espacios_arquitectonicos (NUEVA) -- unidad_base, rango_min/max, modulos_tipicos_json
```

#### `composicion_json` (ejemplo canónico)
```jsonc
{
  "items": [
    { "id": "tablero_madera", "cantidad": 0.5, "unidad": "m2" },
    { "id": "bisagra_blum",    "cantidad": 2 },
    { "id": "gaveta_estandar", "cantidad": 1, "composicion": {
        "items": [ { "id": "panel_frontal", "cantidad": 1 },
                   { "id": "corredera_full", "cantidad": 1 } ],
        "procesos": [ { "id": "proc_armado", "tiempo_min": 30 } ]
    } }
  ],
  "procesos": [ { "id": "proc_corte", "tiempo_min": 20 } ],
  "selecciones": { "acabado": { "id": "poliuretano", "variante": "mate" },
                   "color":  { "id": "N-450" } }
}
```

---

## Archivos Afectados (detalle de ejecución de F1)

> Pendiente de expandir al aprobar este snapshot como detalle t-075 (el Código completa la lista de archivos/migración). Alcance mínimo: nuevas tablas del grafo + migración + seed real (t-077).

- `arnes/planes/plan_t-075.md` (crear — este snapshot)
- `lib/db/schema.ts` (tables nuevas del grafo: marcas, productos_atributos, campos_tecnicos_definicion, catalogos_colores, producto_colores, catalogos_acabados, acabado_variantes, producto_acabados, acabado_compatibilidades, catalogo_componentes, catalogo_procesos, catalogo_espacios_arquitectonicos)
- `drizzle/` (migración del grafo)

---

## Criterios de Aceptación (preliminar — se afinan en ejecución)

1. `npx tsc --noEmit` 0 errores.
2. `npx eslint .` 0 errores.
3. `npm run db:migrate` + `db:seed` limpios en dev-local con las tablas del grafo.
4. Round-trip: un producto con colores/acabados/composición persistido y leído sin pérdida.
5. Regla de compatibilidad verificada: un mesón NO devuelve acabados fuera de {mate, brillante}; una madera devuelve su set completo.
6. Migración: `descripcion` legacy → `nombre`; `descripcion_breve` NO toma el valor legacy.

---

## Qué NO Incluye Este Plan

- No incluye: rediseño de `leads`/`clientes`/`proyectos` ampliadas (embudo F1) — se registra aparte.
- No incluye: UI de administración de catálogos ni cotizador (F2/P-04).
- No incluye: inventario de taller (módulo aparte, definido en F1 como debe manejar insumos + herramientas/maquinaria).
- No incluye: seed de datos reales (es t-077).

---

## Preguntas Abiertas

No hay preguntas abiertas. Las 8 decisiones del bucle F1 (ver "Decisiones del Supervisor") las cerró Javier el 2026-08-05.

---

## Aprobación del Plan

- **Revisor:** Javier (Supervisor)
- **Fecha de aprobación:** 2026-08-05
- **Estado:** pendiente

**Observaciones del revisor (si aplica):**

---

## Referencias

- Esquema de tarea: [ESQUEMA_TAREA.md](../tareas/ESQUEMA_TAREA.md)
- Plan maestro: [plan_ola7_maestro.md](plan_ola7_maestro.md) (fase F1, mini-diamante M-02)
- FLAG-4 aprobado: [OLA_6_FLAG4_PRODUCTOS_CATALOGO.md](../diagnostico/OLA_6_FLAG4_PRODUCTOS_CATALOGO.md)
- Borrador M-02 (descartado, 7 grafos): [OLA_6_METODOLOGIA_GRAFOS.md](../diagnostico/OLA_6_METODOLOGIA_GRAFOS.md)
- Declaración de zonas: [AGENTS.md](../../AGENTS.md) (zona `datos`)
