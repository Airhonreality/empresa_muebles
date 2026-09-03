DO $migr$ BEGIN
  CREATE TYPE "public"."categoria_nota_reunion" AS ENUM(
    'requisito_cliente',
    'cambio_diseno',
    'cambio_presupuesto',
    'acuerdo',
    'libre'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $migr$;

CREATE TABLE IF NOT EXISTS "notas_reunion" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "proyecto_id" uuid NOT NULL,
  "espacio_variante_id" uuid,
  "categoria" "categoria_nota_reunion" NOT NULL,
  "contenido" text NOT NULL,
  "creado_por" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $migr2$ BEGIN
  ALTER TABLE "notas_reunion"
    ADD CONSTRAINT "notas_reunion_proyecto_id_proyectos_id_fk"
    FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $migr2$;

DO $migr3$ BEGIN
  ALTER TABLE "notas_reunion"
    ADD CONSTRAINT "notas_reunion_espacio_variante_id_espacio_variantes_id_fk"
    FOREIGN KEY ("espacio_variante_id") REFERENCES "espacio_variantes"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $migr3$;