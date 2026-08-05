CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"actor_rol" text,
	"accion" text NOT NULL,
	"entidad_tipo" text,
	"entidad_id" uuid,
	"cambios_json" jsonb,
	"gate_evaluado" text,
	"decision" text,
	"ip_origen" text,
	"razon_texto" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ocurrencia_id" text,
	"tipo_evento" text NOT NULL,
	"entidad" text NOT NULL,
	"entidad_id" uuid NOT NULL,
	"estado_antes" text,
	"estado_despues" text,
	"actor_id" uuid,
	"actor_rol" text,
	"evento_referencia_id" uuid,
	"lead_id" uuid,
	"cliente_id" uuid,
	"proyecto_id" uuid,
	"contrato_id" uuid,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parametros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clave" text NOT NULL,
	"grupo" text,
	"tipo" text NOT NULL,
	"valor_numeric" numeric(14, 2),
	"valor_texto" text,
	"valor_booleano" boolean,
	"unidad" text,
	"descripcion" text,
	"vigente_desde" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parametros_clave_unique" UNIQUE("clave"),
	CONSTRAINT "parametros_exclusion_valores" CHECK ((
			("parametros"."tipo" = 'numerico' AND "parametros"."valor_numeric" IS NOT NULL AND "parametros"."valor_texto" IS NULL AND "parametros"."valor_booleano" IS NULL) OR
			("parametros"."tipo" = 'texto' AND "parametros"."valor_numeric" IS NULL AND "parametros"."valor_texto" IS NOT NULL AND "parametros"."valor_booleano" IS NULL) OR
			("parametros"."tipo" = 'booleano' AND "parametros"."valor_numeric" IS NULL AND "parametros"."valor_texto" IS NULL AND "parametros"."valor_booleano" IS NOT NULL)
		))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parametros_historial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parametro_id" uuid,
	"clave_snapshot" text NOT NULL,
	"valor_numeric_anterior" numeric(14, 2),
	"valor_numeric_nuevo" numeric(14, 2),
	"valor_texto_anterior" text,
	"valor_texto_nuevo" text,
	"valor_booleano_anterior" boolean,
	"valor_booleano_nuevo" boolean,
	"actor_id" uuid,
	"actor_rol" text,
	"motivo" text,
	"vigente_desde" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"documento" text,
	"telefono" text,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personas_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid,
	"rol_id" uuid,
	"activo" boolean DEFAULT true NOT NULL,
	"desde" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "procedencia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hijo_entidad" text NOT NULL,
	"hijo_id" uuid NOT NULL,
	"padre_entidad" text NOT NULL,
	"padre_id" uuid NOT NULL,
	"tipo_evento" text,
	"tipo_relacion" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	CONSTRAINT "roles_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "persona_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_usuarios_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventos" ADD CONSTRAINT "eventos_actor_id_usuarios_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventos" ADD CONSTRAINT "eventos_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventos" ADD CONSTRAINT "eventos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventos" ADD CONSTRAINT "eventos_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventos" ADD CONSTRAINT "eventos_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventos" ADD CONSTRAINT "eventos_evento_referencia_id_eventos_id_fk" FOREIGN KEY ("evento_referencia_id") REFERENCES "public"."eventos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parametros_historial" ADD CONSTRAINT "parametros_historial_parametro_id_parametros_id_fk" FOREIGN KEY ("parametro_id") REFERENCES "public"."parametros"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parametros_historial" ADD CONSTRAINT "parametros_historial_actor_id_usuarios_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personas_roles" ADD CONSTRAINT "personas_roles_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personas_roles" ADD CONSTRAINT "personas_roles_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
