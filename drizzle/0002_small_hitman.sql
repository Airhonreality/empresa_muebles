ALTER TYPE "public"."estado_proyecto" ADD VALUE 'retoma';--> statement-breakpoint
ALTER TYPE "public"."rol_empleado" ADD VALUE 'desarrollador' BEFORE 'taller';--> statement-breakpoint
ALTER TYPE "public"."rol_empleado" ADD VALUE 'compras' BEFORE 'taller';--> statement-breakpoint
ALTER TYPE "public"."rol_empleado" ADD VALUE 'supervisora_qa';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "espacios_artefactos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"espacio_variante_id" uuid NOT NULL,
	"categoria" text NOT NULL,
	"dimensiones_mm" text,
	"tipo_specifique" text,
	"ubicacion" text,
	"foto_url" text,
	"requiere_verificacion" boolean DEFAULT false NOT NULL,
	"validado_por" uuid,
	"validado_en" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proyectos_estados_historial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"estadoAnterior" "estado_proyecto" NOT NULL,
	"estadoNuevo" "estado_proyecto" NOT NULL,
	"cambiado_por" uuid,
	"razon" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proyectos" ADD COLUMN "comercial_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "espacios_artefactos" ADD CONSTRAINT "espacios_artefactos_espacio_variante_id_espacio_variantes_id_fk" FOREIGN KEY ("espacio_variante_id") REFERENCES "public"."espacio_variantes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos_estados_historial" ADD CONSTRAINT "proyectos_estados_historial_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos_estados_historial" ADD CONSTRAINT "proyectos_estados_historial_cambiado_por_personas_id_fk" FOREIGN KEY ("cambiado_por") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos_estados_historial" ADD CONSTRAINT "proyectos_estados_historial_proyecto_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos_estados_historial" ADD CONSTRAINT "proyectos_estados_historial_cambiado_por_fk" FOREIGN KEY ("cambiado_por") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_comercial_id_personas_id_fk" FOREIGN KEY ("comercial_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
