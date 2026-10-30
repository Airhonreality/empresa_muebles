-- 0035 · Reconciliación final del drift ad-hoc que nunca tuvo migración:
--   · items_variante.jornadas_* (commit adc0683 "Jornadas por item")
--   · FKs de leads a proyectos/clientes (schema.ts las declara; la BD vive sin ellas)
--
-- ADITIVO e IDEMPOTENTE: no borra columnas, tablas ni filas.
-- Aplicar con: npx tsx scripts/apply-sql-migration.ts drizzle/v3/0035_item_jornadas_leads_fks.sql --apply

-- ── 1. Jornadas propias del ítem ─────────────────────────────────────────────
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "jornadas_desarrollo_tecnico" numeric(8, 2) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "jornadas_ensamblaje_taller" numeric(8, 2) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "items_variante" ADD COLUMN IF NOT EXISTS "jornadas_instalacion_obra" numeric(8, 2) DEFAULT '0' NOT NULL;
--> statement-breakpoint

-- ── 2. FKs de leads (ambas columnas existen y hoy no tienen ninguna fila con valor) ──
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_proyecto_id_proyectos_id_fk') THEN
		ALTER TABLE "leads" ADD CONSTRAINT "leads_proyecto_id_proyectos_id_fk"
			FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id")
			ON DELETE no action ON UPDATE no action;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_cliente_id_clientes_id_fk') THEN
		ALTER TABLE "leads" ADD CONSTRAINT "leads_cliente_id_clientes_id_fk"
			FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id")
			ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
