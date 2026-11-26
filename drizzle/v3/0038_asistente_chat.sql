-- 0038 · Asistente de chat del ERP (t-198): tablas y enums nuevos, ADITIVO.
-- Generado con drizzle-kit desde lib/db/schema.ts. Revisado a mano: solo CREATE TYPE/TABLE/FK nuevos.
-- Re-ejecutable (idempotente): los CREATE TYPE van en bloques DO que ignoran duplicate_object;
-- las tablas usan IF NOT EXISTS y las FK se crean dentro de bloques DO que ignoran duplicate_object.
-- Aplicar con: npx tsx scripts/apply-sql-migration.ts drizzle/v3/0038_asistente_chat.sql --apply
-- Verificar con: npx tsx scripts/verify-0038-asistente-chat.ts [DATABASE_URL | DATABASE_URL_V3_PREVIEW]

DO $$ BEGIN
 CREATE TYPE "public"."estado_clave_asistente" AS ENUM('activa', 'enfriada', 'invalida', 'desactivada');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."estado_propuesta_asistente" AS ENUM('pendiente', 'ejecutada', 'fallida', 'cancelada', 'vencida');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."proveedor_asistente" AS ENUM('openrouter', 'anthropic', 'google');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."rol_mensaje_asistente" AS ENUM('usuario', 'asistente', 'herramienta');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_llamada_asistente" AS ENUM('herramienta', 'modelo', 'rotacion_clave');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "adjuntos_asistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mensaje_id" uuid NOT NULL,
	"r2_clave" text NOT NULL,
	"nombre" text NOT NULL,
	"tipo_mime" text NOT NULL,
	"tamano_bytes" integer NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "configuracion_asistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clave" text NOT NULL,
	"valor" jsonb NOT NULL,
	"actualizada_por" uuid,
	"actualizada_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "configuracion_asistente_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversaciones_asistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"creada_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llamadas_herramienta_asistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" "tipo_llamada_asistente" NOT NULL,
	"herramienta" text,
	"proveedor_clave_id" uuid,
	"modelo" text,
	"entrada_resumen" text,
	"resultado_resumen" text,
	"tokens_entrada" integer,
	"tokens_salida" integer,
	"costo_estimado" numeric(12, 6),
	"duracion_ms" integer,
	"detalle" text,
	"creada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mensajes_asistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversacion_id" uuid NOT NULL,
	"rol" "rol_mensaje_asistente" NOT NULL,
	"contenido" jsonb NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "propuestas_asistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversacion_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"herramienta" text NOT NULL,
	"entrada" jsonb NOT NULL,
	"resumen" text NOT NULL,
	"estado" "estado_propuesta_asistente" DEFAULT 'pendiente' NOT NULL,
	"creada_en" timestamp DEFAULT now() NOT NULL,
	"vence_en" timestamp NOT NULL,
	"resuelta_en" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proveedores_asistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proveedor" "proveedor_asistente" NOT NULL,
	"etiqueta" text NOT NULL,
	"clave_cifrada" text NOT NULL,
	"clave_ultimos4" text NOT NULL,
	"orden" integer NOT NULL,
	"estado" "estado_clave_asistente" DEFAULT 'activa' NOT NULL,
	"enfriada_hasta" timestamp,
	"creada_en" timestamp DEFAULT now() NOT NULL,
	"actualizada_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "adjuntos_asistente" ADD CONSTRAINT "adjuntos_asistente_mensaje_id_mensajes_asistente_id_fk" FOREIGN KEY ("mensaje_id") REFERENCES "public"."mensajes_asistente"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "configuracion_asistente" ADD CONSTRAINT "configuracion_asistente_actualizada_por_usuarios_id_fk" FOREIGN KEY ("actualizada_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversaciones_asistente" ADD CONSTRAINT "conversaciones_asistente_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "llamadas_herramienta_asistente" ADD CONSTRAINT "llamadas_herramienta_asistente_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "llamadas_herramienta_asistente" ADD CONSTRAINT "llamadas_herramienta_asistente_proveedor_clave_id_proveedores_asistente_id_fk" FOREIGN KEY ("proveedor_clave_id") REFERENCES "public"."proveedores_asistente"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mensajes_asistente" ADD CONSTRAINT "mensajes_asistente_conversacion_id_conversaciones_asistente_id_fk" FOREIGN KEY ("conversacion_id") REFERENCES "public"."conversaciones_asistente"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "propuestas_asistente" ADD CONSTRAINT "propuestas_asistente_conversacion_id_conversaciones_asistente_id_fk" FOREIGN KEY ("conversacion_id") REFERENCES "public"."conversaciones_asistente"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "propuestas_asistente" ADD CONSTRAINT "propuestas_asistente_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
