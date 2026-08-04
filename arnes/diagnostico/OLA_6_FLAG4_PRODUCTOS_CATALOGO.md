# FLAG-4 — Estructura relacional de catálogos (Productos, Insumos, Herramientas)

**Rol:** Código (ejecuta decisión FLAG-4 aprobada)  
**Fecha:** 2026-08-04  
**Status:** ✅ APROBADO POR SUPERVISOR  
**Referencia:** FLAG-4 de `fase2_ronda3_decisiones_respondidas.md`

---

## Veredicto

**NO es una columna `tipo` con enum.** Es un **modelo de especialización relacional axiomático:**

```
productos_catalogo (tabla base compartida)
  ├─ productos_tienda (extensión: campos específicos de storefront)
  ├─ materiales_insumos (extensión: campos específicos de compra/costeo)
  └─ herramientas_maquinaria (extensión: campos específicos de mantenimiento/operación)
```

**Razón:** Cada universo tiene campos distintos y relaciones exclusivas. Una columna enum colapsaría estructura legítima.

---

## Tabla base: `productos_catalogo`

Contiene los **campos compartidos** de todas las especializaciones:

| Campo | Tipo | Nullable | Notas |
|-------|------|----------|-------|
| `id` | UUID | NOT NULL, PK | |
| `nombre` | VARCHAR(255) | NOT NULL | Ej: "Chipboard Eucalipto 18mm", "Bisagra Blum 110°", "Taladro DeWalt DCD791" |
| `descripcion_breve` | TEXT | YES | Resumen técnico |
| `valor_unitario` | DECIMAL(15,2) | NOT NULL | Precio de adquisición/referencia |
| `unidad_medida` | VARCHAR(20) | NOT NULL | "metro", "pieza", "kg", "litro", "hora", etc. |
| `proveedor_id` | UUID | NOT NULL, FK→`proveedores` | |
| `activo` | BOOLEAN | NOT NULL, DEFAULT=true | Control de ciclo de vida |
| `tipo_catalogo` | VARCHAR(50) | NOT NULL | ENUM: `producto_tienda`, `material_insumo`, `herramienta_maquinaria` |
| `creado_en` | TIMESTAMP | NOT NULL | Auditoría |
| `actualizado_en` | TIMESTAMP | NOT NULL | Auditoría |

**Constraint:** `CHECK (tipo_catalogo IN ('producto_tienda', 'material_insumo', 'herramienta_maquinaria'))`

---

## Tabla extensión: `productos_tienda`

**Universo:** Productos terminados para venta en storefront + orden de compra del cliente.

| Campo | Tipo | Nullable | Notas |
|-------|------|----------|-------|
| `id` | UUID | NOT NULL, PK | |
| `catalogo_id` | UUID | NOT NULL, FK→`productos_catalogo` | Relación 1:1 |
| **Universo de tienda** | | | |
| `descripcion_diseño` | TEXT | YES | Narrativa de concepto, inspiración, aplicaciones |
| `imagen_principal_url` | VARCHAR(1024) | YES | URL en R2 (DIFERIDO: implementación en t-034) |
| `categoria_tienda` | VARCHAR(100) | YES | "Muebles", "Acabados", "Textiles", "Accesorios" |
| `visible_en_tienda` | BOOLEAN | NOT NULL, DEFAULT=true | Control de publicación |
| `frecuencia_compra_historial` | JSONB | YES | `{total: 42, ultimos_6m: 8}` — análisis de demanda |
| `calificacion_promedio` | DECIMAL(3,1) | YES | 0-5 estrellas |
| **Relación con almacén** | | | |
| `inventario_disponible` | INTEGER | NOT NULL, DEFAULT=0 | Apenas aplicable (se maneja en `pedidos_web` y `ordenes_trabajo`) |
| `punto_reorden_unidades` | INTEGER | YES | Triggers para OC operativa |
| `tiempo_reposicion_dias` | INTEGER | YES | SLA de entrega a tienda |
| **Composición de costo** | | | |
| `materiales_insumos_json` | JSONB | NOT NULL | `[{insumo_id, cantidad, unidad}]` — grafo BOM para costeo |
| `procesos_produccion_json` | JSONB | NOT NULL | `[{proceso_id, costo_mano_obra, duracion_horas}]` — desglose de costo |
| `margen_ganancia_pct` | DECIMAL(5,2) | NOT NULL | % sobre costo total = valor_tienda - costo_produccion |
| `valor_tienda` | DECIMAL(15,2) | NOT NULL | Precio público (calculado al crear, congelado; parametrizable via `margen_ganancia_pct`) |
| **Auditoría** | | | |
| `creado_en` | TIMESTAMP | NOT NULL | |
| `actualizado_en` | TIMESTAMP | NOT NULL | |

**Constraints:**
- `FK (catalogo_id)` REFERENCES `productos_catalogo(id)` + `CHECK (tipo_catalogo='producto_tienda')`
- `UNIQUE (catalogo_id)` — 1:1
- `CHECK (calificacion_promedio IS NULL OR (calificacion_promedio >= 0 AND calificacion_promedio <= 5))`
- `CHECK (inventario_disponible >= 0)`

**Relaciones adicionales:**
- 1→N `pedidos_web.producto_tienda_id` — historco de compras
- Consumidor de `E-42` (embudo), `E-55` (testimonios, DIFERIDO)

---

## Tabla extensión: `materiales_insumos`

**Universo:** Materias primas y componentes para uso en producción (compra, almacén, BOM).

| Campo | Tipo | Nullable | Notas |
|-------|------|----------|-------|
| `id` | UUID | NOT NULL, PK | |
| `catalogo_id` | UUID | NOT NULL, FK→`productos_catalogo` | Relación 1:1 |
| **Universo de compra/almacén** | | | |
| `codigo_interno` | VARCHAR(50) | YES | SKU del sistema legacy (ej: "CHI-EU-18-2050") |
| `lote_minimo` | INTEGER | NOT NULL | Cantidad mínima por OC |
| `lote_multiplo` | INTEGER | NOT NULL, DEFAULT=1 | OC debe ser múltiplo de esto |
| `tiempo_entrega_dias` | INTEGER | NOT NULL | SLA de proveedor |
| `descuento_volumen_json` | JSONB | YES | `[{cantidad_desde, cantidad_hasta, descuento_pct}]` — negociación |
| `punto_reorden_unidades` | INTEGER | NOT NULL | Trigger para OC operativa automática |
| **Especificaciones técnicas** | | | |
| `especificacion_tecnica` | TEXT | YES | Normas ISO, densidad, resistencia, etc. |
| `fecha_vencimiento_dias` | INTEGER | YES | Vida útil (NULL = indefinido) |
| `almacenamiento_instrucciones` | TEXT | YES | Condiciones de conservación |
| **Trazabilidad de producción** | | | |
| `es_componente_terminado_json` | JSONB | YES | `{puede_venderse: boolean, en_producto_id: [...]}`— si es componente de producto tienda |
| `procesos_entrada` | JSONB | YES | `[{proceso_id, secuencia}]` — flujos que lo consumen |
| **Auditoría** | | | |
| `creado_en` | TIMESTAMP | NOT NULL | |
| `actualizado_en` | TIMESTAMP | NOT NULL | |

**Constraints:**
- `FK (catalogo_id)` REFERENCES `productos_catalogo(id)` + `CHECK (tipo_catalogo='material_insumo')`
- `UNIQUE (catalogo_id)` — 1:1
- `CHECK (lote_minimo > 0)`
- `CHECK (punto_reorden_unidades >= 0)`

**Relaciones adicionales:**
- N←1 `bom_materiales.material_insumo_id` — usado en BOMs de productos tienda
- N←1 `items_orden_compra.material_insumo_id` — líneas de OC
- Consumidor de `E-19` (OC), `E-20` (gates de caja)

---

## Tabla extensión: `herramientas_maquinaria`

**Universo:** Equipos de taller/producción (máquinas, herramientas, dispositivos de medición).

| Campo | Tipo | Nullable | Notas |
|-------|------|----------|-------|
| `id` | UUID | NOT NULL, PK | |
| `catalogo_id` | UUID | NOT NULL, FK→`productos_catalogo` | Relación 1:1 |
| **Identidad y marca** | | | |
| `marca` | VARCHAR(100) | NOT NULL | "DeWalt", "Bosch", "Blum", "Festool" |
| `modelo` | VARCHAR(100) | NOT NULL | Número de serie/modelo del fabricante |
| `numero_serie` | VARCHAR(100) | YES | Para máquinas registradas |
| `año_adquisicion` | INTEGER | YES | Control de antigüedad |
| **Especificaciones operativas** | | | |
| `potencia_watts` | DECIMAL(8,2) | YES | Ej: 1200.50 para taladro, NULL para herramienta manual |
| `peso_kg` | DECIMAL(10,2) | YES | |
| `dimensiones_cm_json` | JSONB | YES | `{ancho, alto, profundo}` |
| `velocidades_rpm_json` | JSONB | YES | `[1000, 1500, 2000]` si aplica |
| **Ciclo de vida y mantenimiento** | | | |
| `estado_operativo` | VARCHAR(50) | NOT NULL | ENUM: `operativa`, `mantenimiento_programado`, `reparacion`, `fuera_servicio` |
| `mantenimiento_proximo_fecha` | DATE | YES | Próxima inspección/lubricación |
| `mantenimiento_historial_json` | JSONB | NOT NULL | `[{fecha, tipo, costo, responsable_id, notas}]` — auditoría de servicios |
| `vida_util_horas_esperadas` | DECIMAL(10,1) | YES | Horas de vida útil según fabricante |
| `horas_usadas_acumuladas` | DECIMAL(10,1) | NOT NULL, DEFAULT=0 | Contador de desgaste |
| **Documentación técnica** | | | |
| `manual_pdf_url` | VARCHAR(1024) | YES | URL en Drive/R2 (DIFERIDO: implementación en t-034) |
| `ficha_tecnica_json` | JSONB | YES | Especificaciones del fabricante (embebidas) |
| `mejores_practicas_operacion` | TEXT | YES | Instrucciones de uso, riesgos, calibración |
| `notas_particularidades` | TEXT | YES | "Requiere calibración cada 6 meses", "Muy sensible a humedad", etc. |
| **Reposición y repuesto** | | | |
| `repuestos_criticos_json` | JSONB | YES | `[{repuesto_id, frecuencia_cambio_meses, costo}]` — grafo de consumibles |
| `proveedor_servicio_id` | UUID | YES | FK→`proveedores` si outsourcing de mantenimiento |
| **Auditoría** | | | |
| `creado_en` | TIMESTAMP | NOT NULL | |
| `actualizado_en` | TIMESTAMP | NOT NULL | |

**Constraints:**
- `FK (catalogo_id)` REFERENCES `productos_catalogo(id)` + `CHECK (tipo_catalogo='herramienta_maquinaria')`
- `UNIQUE (catalogo_id)` — 1:1
- `CHECK (horas_usadas_acumuladas >= 0 AND (vida_util_horas_esperadas IS NULL OR horas_usadas_acumuladas <= vida_util_horas_esperadas * 1.5))`
- `CHECK (estado_operativo IN ('operativa', 'mantenimiento_programado', 'reparacion', 'fuera_servicio'))`

**Relaciones adicionales:**
- N←1 `ordenes_compra.items` FK→`herramienta_maquinaria` (reposición operativa, E-45)
- Consumidor de `E-45` (reposición herramientas)

---

## Ejemplo de composición (axiomática)

### Producto tienda: "Zapatero módulo pintado 3 puertas"

```json
{
  "id": "prod-z001",
  "nombre": "Zapatero módulo pintado 3 puertas",
  "tipo_catalogo": "producto_tienda",
  "valor_unitario": 245000,  // costo de referencia (compra integrada)
  
  // Extensión tienda
  "tienda": {
    "descripcion_diseño": "Módulo de almacenamiento moderno con 3 puertas abatibles, pintura blanca satinada, herrajes de cierre suave",
    "materiales_insumos_json": [
      {"insumo_id": "ins-chip-eu-18", "cantidad": 0.85, "unidad": "metro"},
      {"insumo_id": "ins-bisagra-blum", "cantidad": 3, "unidad": "pieza"},
      {"insumo_id": "ins-pintura-blanca", "cantidad": 0.5, "unidad": "litro"}
    ],
    "procesos_produccion_json": [
      {"proceso_id": "proc-corte", "costo_mano_obra": 15000, "duracion_horas": 1},
      {"proceso_id": "proc-ensamble", "costo_mano_obra": 20000, "duracion_horas": 1.5},
      {"proceso_id": "proc-acabado", "costo_mano_obra": 12000, "duracion_horas": 1}
    ],
    "margen_ganancia_pct": 35.0,  // PARÁMETRO EDITABLE
    "valor_tienda": 385000  // congelado al crear, NO recalcula
  }
}
```

**Sin hardcode:** Si `margen_ganancia_pct` cambia en `parametros`, los NUEVOS productos usan el nuevo %. Los existentes mantienen su `valor_tienda` histórico.

### Material insumo: "Chipboard eucalipto 18mm"

```json
{
  "id": "ins-chip-eu-18",
  "nombre": "Chipboard eucalipto 18mm",
  "tipo_catalogo": "material_insumo",
  "proveedor_id": "prov-sivaltriplex",
  
  // Extensión insumo
  "insumo": {
    "codigo_interno": "CHI-EU-18-2050",
    "lote_minimo": 10,  // pliegos
    "punto_reorden_unidades": 50,
    "tiempo_entrega_dias": 14,
    "especificacion_tecnica": "DIN 68365, densidad 640 kg/m³, resistencia borde 0.5 MPa",
    "es_componente_terminado_json": {
      "puede_venderse": false,
      "en_producto_id": ["prod-z001", "prod-estante-m2"]
    }
  }
}
```

### Herramienta: "Taladro DeWalt DCD791"

```json
{
  "id": "her-dewalt-dcd791",
  "nombre": "Taladro DeWalt DCD791",
  "tipo_catalogo": "herramienta_maquinaria",
  "proveedor_id": "prov-dewalt-servicio",
  
  // Extensión herramienta
  "herramienta": {
    "marca": "DeWalt",
    "modelo": "DCD791",
    "numero_serie": "DCD791-2024-00847",
    "año_adquisicion": 2024,
    "potencia_watts": 1200,
    "peso_kg": 1.3,
    "estado_operativo": "operativa",
    "mantenimiento_proximo_fecha": "2026-09-04",
    "mantenimiento_historial_json": [
      {"fecha": "2026-08-04", "tipo": "revisión_calibración", "costo": 45000, "responsable_id": "pers-tecnico-001"}
    ],
    "vida_util_horas_esperadas": 1000,
    "horas_usadas_acumuladas": 247.5,
    "mejores_practicas_operacion": "Lubricar eje cada 40 horas de uso. Cambiar portabrocas cada 500 horas. Verificar alineación antes de usar",
    "repuestos_criticos_json": [
      {"repuesto_id": "rep-portabrocas-dcd", "frecuencia_cambio_meses": 12, "costo": 125000}
    ]
  }
}
```

---

## Axiomática de parámetros

**Principio:** Ningún valor numérico tunable vive hardcoded. Está en `parametros` tabla.

| Parámetro | Alcance | Lectura | Congelamiento |
|-----------|---------|--------|----------------|
| `margen_ganancia_pct_default` | `productos_tienda` | Al crear fila | Sí, en columna `margen_ganancia_pct` |
| `punto_reorden_unidades_default` | `materiales_insumos` | Al crear fila | Sí, en columna `punto_reorden_unidades` |
| `mantenimiento_intervalo_horas_default` | `herramientas_maquinaria` | Logica de alerta | Vivo (recalcula cada lectura) |

**Regla:** Si el parámetro afecta al valor de una fila, se congela en la fila al crear. Si afecta a lógica de operación (alertas, gates), se lee vivo.

---

## Decisiones de Ola 7

### Decisión D1: ¿Tablas separadas o herencia?

**Respuesta:** Tablas separadas 1:1 con `productos_catalogo`.

**Por qué:** Herencia en Postgres/Drizzle causa complejidad de queries. 1:1 es más explícito: `SELECT * FROM productos_catalogo p LEFT JOIN productos_tienda pt ON p.id=pt.catalogo_id WHERE p.tipo_catalogo='producto_tienda'`.

### Decisión D2: ¿Dónde validar `tipo_catalogo`?

**Respuesta:** CHECK constraint + lógica de aplicación (nunca confiar en BD).

En Drizzle:
```typescript
export const productos_catalogo = pgTable('productos_catalogo', {
  id: uuid('id').primaryKey(),
  tipo_catalogo: text('tipo_catalogo').notNull().$defaultFn(() => 'producto_tienda'),
  // ...
}, (table) => [
  check('tipo_check', sql`tipo_catalogo IN ('producto_tienda', 'material_insumo', 'herramienta_maquinaria')`),
]);
```

### Decisión D3: Migración desde legacy

**Aplicable en Fase 1 (t-074→t-077):**

1. **Herramientas:** INSERT en `herramientas_maquinaria` desde tabla `herramientas` legacy (si existía).
2. **Materiales:** INSERT en `materiales_insumos` + `productos_catalogo` (insertar en ambas con FK).
3. **Productos tienda:** INSERT en `productos_tienda` + `productos_catalogo` (post-migración de datos, no legacy).

---

## Checklist de implementación (Ola 7)

- [ ] Crear tabla `productos_catalogo` base
- [ ] Crear tabla `productos_tienda` (FK 1:1, CHECK)
- [ ] Crear tabla `materiales_insumos` (FK 1:1, CHECK)
- [ ] Crear tabla `herramientas_maquinaria` (FK 1:1, CHECK)
- [ ] Crear índices en `tipo_catalogo` y FKs
- [ ] Seed datos básicos (herramientas, insumos comunes, productos demostración)
- [ ] Tests: validar CHECK constraints, 1:1 integridad
- [ ] Tests: queries de composición (JOIN de especialización)
- [ ] Verificación QA: 0 campos muertos en especializaciones

---

## Registro

- **Fecha:** 2026-08-04
- **Decisión:** FLAG-4 APROBADA por Supervisor (estructura axiomática base + 3 especializaciones)
- **Responsable Ola 7:** t-075 (crear tablas de catálogos)
- **Estado:** ✅ VIGENTE PARA OLA 7

---

**Próximo:** Ola 7 (t-074→t-090) — codificación de tablas según este contrato + `d3_schema_consolidado.md`.
