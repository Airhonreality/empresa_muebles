# Ola 6 — Schemas relacionales APROBADOS (2026-08-04)

**Supervisor:** Javier  
**Status:** ✅ APROBADO  
**Próximo:** Ola 6.2 (seed datos) → Ola 7 (Execute)

---

## Principios rectores

1. **Axiomático, no acoplado:** Cada tabla es DATA pura, LABOR pura, o COMPOSICIÓN. Costos se derivan, no se almacenan fijos.
2. **Flexible para dualidad:** Soporta pago por TIEMPO (v1) + MÓDULO (v2) simultáneamente sin rewrite.
3. **Trazabilidad total:** audit_logs captura quién, qué, cuándo, por qué en cada decisión.

---

## 7 Schemas core (Ola 6 → Ola 7)

### 1. `catalogo_herrajes` — DATA pura del herraje

```sql
CREATE TABLE catalogo_herrajes (
  id UUID PRIMARY KEY,
  sku VARCHAR UNIQUE,
  marca VARCHAR NOT NULL,
  nombre VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL REFERENCES catalogo_tipos_herraje(id),
  descripcion TEXT,
  
  -- Dimensiones físicas
  ancho_mm INTEGER,
  alto_mm INTEGER,
  profundo_mm INTEGER,
  
  -- Unidad de compra
  unidad_medida VARCHAR (enum: 'unidad', 'metro', 'metro_cuadrado', etc.),
  
  -- Precios
  precio_directo_cop INTEGER NOT NULL,
  precio_publico_cop INTEGER NOT NULL,
  
  -- Inventario
  stock_actual INTEGER DEFAULT 0,
  
  -- Proveedor
  proveedor_id UUID REFERENCES proveedores(id),
  
  -- Referencias
  url_referencia VARCHAR,
  url_imagen VARCHAR,
  modelo_3d_url VARCHAR (formato: .obj, .gltf),
  
  -- Control web
  segmento_comercial VARCHAR (enum: 'consolas', 'cocinas', 'closets', etc.),
  publicado_web BOOLEAN DEFAULT false,
  
  -- Auditoría
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);
```

**Notas:**
- NO incluye `costo_instalacion` (es derivado del proceso)
- NO incluye `costo_desarrollo` (es derivado del componente que lo usa)
- `marca` es columna regular (no FK) — permite datos libres

---

### 2. `catalogo_procesos` — LABOR pura

```sql
CREATE TABLE catalogo_procesos (
  id UUID PRIMARY KEY,
  codigo VARCHAR UNIQUE NOT NULL (e.g. 'ARM-001', 'ELE-002'),
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  
  -- Tiempo y costo
  tiempo_estimado_minutos INTEGER NOT NULL,
  -- COSTO se calcula en query: tiempo_min / 60 × tarifa_hora_operario
  
  -- Dependencias
  requiere_proceso_ids UUID[] (array de FK a catalogo_procesos),
  
  -- Herrajes involucrados (informativo, NO vinculante)
  herrajes_involucrados_json JSONB (e.g. [{id, cantidad}, ...]),
  
  -- Control
  disponible BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Ejemplo:
-- ('ARM-001', 'Armado estructura modular', 'Armar tableros en marco', 60, null, null)
-- ('ELE-002', 'Instalación conexión eléctrica', 'Cableado y test', 15, ['ELE-001'], null)
-- ('ACB-002', 'Instalación condimentero', 'Montaje condimentero 30L', 30, ['herraje_condimentero'], [{id: 'herb_001', cant: 1}])
```

**Notas:**
- `tiempo_estimado_minutos` es DATO. Costo se calcula: `(minutos / 60) × tarifa_hora`
- `requiere_proceso_ids` permite definir secuencias (ej: no instalar herraje antes de armar estructura)
- NO almacena costo directo → Axiomático

---

### 3. `catalogo_insumos` — DATA pura de materiales

```sql
CREATE TABLE catalogo_insumos (
  id UUID PRIMARY KEY,
  sku VARCHAR UNIQUE,
  marca VARCHAR NOT NULL,
  nombre VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL (enum: 'tablero', 'perfil', 'tornillo', 'pintura', 'laminado', etc.),
  descripcion TEXT,
  
  -- Especificaciones
  unidad_medida VARCHAR (e.g. 'metro_cuadrado', 'metro_lineal', 'pieza'),
  cantidad_disponible INTEGER,
  
  -- Precios
  precio_compra_por_unidad_cop DECIMAL NOT NULL,
  
  -- Calidad
  especificacion_tecnica TEXT (e.g. espesor, densidad, resistencia),
  
  -- Proveedor
  proveedor_id UUID REFERENCES proveedores(id),
  
  -- Referencias
  url_referencia VARCHAR,
  url_imagen VARCHAR,
  
  -- Control web
  publicado_web BOOLEAN DEFAULT false,
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Ejemplos:
-- ('TABL-001', 'Tablero MDF 18mm', tipo='tablero', precio=350k/m²)
-- ('PERF-001', 'Perfil LED aluminio', tipo='perfil', precio=2500/metro)
-- ('TORN-001', 'Tornillo PZ 3x25', tipo='tornillo', precio=500/100piezas)
```

---

### 4. `catalogo_componentes` — COMPOSICIÓN (insumos + labor)

```sql
CREATE TABLE catalogo_componentes (
  id UUID PRIMARY KEY,
  nombre VARCHAR NOT NULL (e.g. 'Gaveta con corredera full-ext'),
  descripcion TEXT,
  tipo VARCHAR (enum: 'gaveta', 'puerta', 'repisa', 'módulo', 'ensamble'),
  
  -- Composición: qué insumos y procesos necesita
  composicion_json JSONB NOT NULL,
  -- {
  --   "insumos": [
  --     {id: "insumo_tablero", cantidad: 0.5, unidad: "m²"},
  --     {id: "insumo_tornillo", cantidad: 16, unidad: "piezas"}
  --   ],
  --   "procesos": [
  --     {id: "proc_corte", tiempo_min: 20},
  --     {id: "proc_armado", tiempo_min: 30},
  --     {id: "proc_tornillos", tiempo_min: 10}
  --   ],
  --   "herrajes": [
  --     {id: "herb_corredera_full", cantidad: 1}
  --   ]
  -- }
  
  -- Costo derivado (informativo, NO canónico)
  costo_derivado_insumos_cop INTEGER (calculado en query),
  costo_derivado_labor_cop INTEGER (calculado en query),
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Derivaciones en query:
-- costo_derivado_insumos = SUM(insumo.precio × cantidad)
-- costo_derivado_labor = SUM(proceso.tiempo_min / 60 × tarifa_hora)
```

**Notas:**
- `composicion_json` es flexible → permite evolucionar sin migración
- Costos son CALCULADOS en tiempo de consulta, nunca almacenados
- Permite variantes (ej: gaveta con corredera oculta vs full-extensión)

---

### 5. `catalogo_espacios_arquitectonicos` — Métrica de espacios

```sql
CREATE TABLE catalogo_espacios_arquitectonicos (
  id UUID PRIMARY KEY,
  codigo VARCHAR UNIQUE (e.g. 'ESP-001'),
  nombre VARCHAR NOT NULL (e.g. 'Cocina integral'),
  descripcion TEXT,
  
  -- Métrica base (NO categorías vagas)
  unidad_base VARCHAR (enum: 'metro_lineal', 'metro_cuadrado', 'metro_cubico'),
  rango_minimo DECIMAL,
  rango_maximo DECIMAL,
  ejemplo_tamaño VARCHAR (e.g. '2.5 m.l.', '4 m²'),
  
  -- Composición típica (referencia, puede variar per proyecto)
  modulos_tipicos_json JSONB (e.g. [{nombre: 'gabinetes', componente_id}, ...]),
  
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Ejemplos:
-- ESP-001: 'Cocina integral', m.l., 2.5–4, '2.5 m.l.', [{gabinetes, encimera, electrif}]
-- ESP-002: 'Closet', m.l.+m², 1.5–3, 4–12, '2.5 m.l. × 2.5 m²'
-- ESP-003: 'Forma especial', m², variable, 1–10, 'Cava hexagonal, mesa round'
```

---

### 6. `configuracion_nomina` — Dualidad tiempo/módulo

```sql
CREATE TABLE configuracion_nomina (
  id UUID PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES usuarios(id),
  
  -- Modelo activo
  modelo_pagocop VARCHAR NOT NULL (enum: 'tiempo', 'modulo', 'hibrido'),
  
  -- Si es híbrido
  proporcion_tiempo_pct INTEGER DEFAULT 100 (0–100, balance entre modelos),
  
  -- Auditoría
  fecha_activacion DATE NOT NULL,
  fecha_cambio_modelo TIMESTAMPTZ,
  aprobado_por_supervisor_id UUID REFERENCES usuarios(id),
  razon_cambio TEXT,
  
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Ejemplos:
-- (empleado_carpenter_1, 'tiempo', 100) — Carpintero paga solo por horas
-- (empleado_carpenter_1, 'hibrido', 70) — Después abril 2026: 70% horas + 30% módulos
-- (empleado_dev_1, 'modulo', null) — Desarrollador paga solo por espacios completados
```

---

### 7. `audit_logs` — Trazabilidad de decisiones

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Quién actuó
  actor_id UUID NOT NULL REFERENCES usuarios(id),
  actor_rol VARCHAR (cached de personas_roles),
  
  -- Qué hizo
  accion VARCHAR NOT NULL (enum: 'crear', 'editar', 'aprobar', 'rechazar', 'calcular', 'pagar', 'cerrar'),
  
  -- Sobre qué
  entidad_tipo VARCHAR (enum: 'proyecto', 'nómina', 'contrato', 'cotizacion', 'desfase', 'parámetro'),
  entidad_id UUID,
  
  -- Cambios
  cambios_json JSONB, -- {campo_anterior: X, campo_nuevo: Y, justificacion: Z}
  
  -- Gate evaluado (si aplica)
  gate_evaluado VARCHAR (enum: 'E-18', 'E-20', 'E-33', etc.),
  
  -- Decisión tomada
  decision VARCHAR (enum: 'aprobado', 'rechazado', 'requiere_supervisor', 'calculado'),
  
  -- Contexto
  ip_origen VARCHAR,
  razon_texto TEXT,
  
  -- Referencia a evento si aplica
  evento_id UUID REFERENCES eventos(id)
);

-- Ejemplos:
-- (actor=javier, accion='editar', entidad=parametro_comision, cambios={anterior: 5, nuevo: 6}, razon='Ajuste anual')
-- (actor=supervisora, accion='calcular', entidad=nomina_marzo, gate='E-35', decision='aprobado')
-- (actor=contador, accion='rechazar', entidad=nómina_carlos, decision='requiere_supervisor', razon='Desfase pendiente')
```

---

## Relaciones simplificadas (grafo)

```
catalogo_herrajes ←→ catalogo_procesos (N:M vía composicion_json)
catalogo_insumos ←→ catalogo_componentes (N:M vía composicion_json)
catalogo_componentes ←→ catalogo_espacios_arquitectonicos (1:N, módulos típicos)

catalogo_herrajes → proveedores (N:1)
catalogo_insumos → proveedores (N:1)

configuracion_nomina → usuarios (N:1)
configuracion_nomina → usuarios (N:1, aprobado_por)

audit_logs → usuarios (N:1, actor)
audit_logs → eventos (1:1 opcional)
```

**NO hay tabla gigante. Cada grafo es separable, escalable, axiomático.**

---

## Próximos pasos

### Ola 6.2 — Seed de datos reales

1. **Espacios arquitectónicos:** Lista completa (cocina, closet, estudio, cava, consola, forma especial)
2. **Procesos elementales:** Lista completa con tiempos (ARM-*, ELE-*, ACB-*, LED-*, ESP-*)
3. **Herrajes:** Catálogo actual de Veta (marca, tipo, precio, stock)
4. **Insumos:** Catálogo de tableros, perfiles, tornillos, acabados
5. **Componentes:** Gaveta, puerta, repisa, módulo → descomposición real
6. **Configuración nómina:** Empleados → modelo (tiempo/módulo/híbrido)

### Ola 7 — Execute (codificación de pantallas)

Con schemas + datos reales, codificar:
- P-04 Cotizador (calcula composición → costo)
- P-22 Compensación (nómina con dualidad tiempo/módulo)
- P-20 Caja (flujo de pagos con audit_logs)
- Otros 31 pantallas con trazabilidad completa

---

**Registro:** 2026-08-04 · Ola 6 CIERRE · Schemas APROBADOS por Supervisor

