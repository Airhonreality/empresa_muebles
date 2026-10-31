-- 0037 · Solución 1 — Patrón Prototipo: tablas de plantillas de espacio (clase vs instancia)
-- ADITIVO: crea plantillas_espacio, plantilla_grupos, plantilla_items y la columna opcional
-- plantilla_espacio_id en espacio_variantes con ON DELETE SET NULL.
--
-- Requiere checkpoint del Supervisor (AGENTS.md) antes de aplicar.
-- Aplicar con: npx tsx scripts/apply-sql-migration.ts drizzle/v3/0037_plantillas_espacio.sql --apply

-- ── Tabla raíz: plantillas_espacio (la CLASE / blueprint, sin proyecto) ──
CREATE TABLE IF NOT EXISTS plantillas_espacio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_espacio TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  orden INTEGER DEFAULT 0 NOT NULL,
  activa BOOLEAN DEFAULT true NOT NULL,
  jornadas_desarrollo_tecnico NUMERIC(8, 2) DEFAULT '0' NOT NULL,
  jornadas_ensamblaje_taller NUMERIC(8, 2) DEFAULT '0' NOT NULL,
  jornadas_instalacion_obra NUMERIC(8, 2) DEFAULT '0' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ── Tabla hija: plantilla_grupos (árbol recursivo vía padreId) ──
CREATE TABLE IF NOT EXISTS plantilla_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_espacio_id UUID NOT NULL REFERENCES plantillas_espacio(id),
  nombre TEXT NOT NULL,
  padre_id UUID REFERENCES plantilla_grupos(id),  -- recursivo
  orden INTEGER DEFAULT 0 NOT NULL,
  jornadas_desarrollo_tecnico NUMERIC(8, 2) DEFAULT '0' NOT NULL,
  jornadas_ensamblaje_taller NUMERIC(8, 2) DEFAULT '0' NOT NULL,
  jornadas_instalacion_obra NUMERIC(8, 2) DEFAULT '0' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ── Tabla hija: plantilla_items ──
CREATE TABLE IF NOT EXISTS plantilla_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_espacio_id UUID NOT NULL REFERENCES plantillas_espacio(id),
  plantilla_grupo_id UUID REFERENCES plantilla_grupos(id),
  nombre_personalizado TEXT NOT NULL,
  cantidad NUMERIC(10, 2) DEFAULT '1' NOT NULL,
  precio_unitario NUMERIC(14, 2) DEFAULT '0' NOT NULL,
  es_referencial BOOLEAN DEFAULT false NOT NULL,
  fuente_referencial TEXT,  -- electrodomestico | obra_civil | servicio_tercero | otro
  grupo_referencial TEXT,
  orden INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ── Columna opcional de trazabilidad en espacio_variantes (la INSTANCIA) ──
ALTER TABLE espacio_variantes
  ADD COLUMN IF NOT EXISTS plantilla_espacio_id UUID;

ALTER TABLE espacio_variantes
  ADD CONSTRAINT espacio_variantes_plantilla_espacio_id_fk
  FOREIGN KEY (plantilla_espacio_id) REFERENCES plantillas_espacio(id)
  ON DELETE SET NULL;

-- ── Índices para consultas frecuentes ──
CREATE INDEX IF NOT EXISTS idx_plantilla_grupos_plantilla_espacio_id ON plantilla_grupos(plantilla_espacio_id);
CREATE INDEX IF NOT EXISTS idx_plantilla_items_plantilla_espacio_id ON plantilla_items(plantilla_espacio_id);
CREATE INDEX IF NOT EXISTS idx_plantilla_items_plantilla_grupo_id ON plantilla_items(plantilla_grupo_id);
CREATE INDEX IF NOT EXISTS idx_espacio_variantes_plantilla_espacio_id ON espacio_variantes(plantilla_espacio_id);
