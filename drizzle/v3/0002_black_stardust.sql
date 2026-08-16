CREATE TYPE "public"."rol_canonico" AS ENUM('admin', 'comercial', 'desarrollador', 'compras', 'taller', 'finanzas', 'supervisora_qa');--> statement-breakpoint
ALTER TABLE "personas_roles" DROP CONSTRAINT "personas_roles_rol_id_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "personas_roles" DROP COLUMN "rol_id";--> statement-breakpoint
ALTER TABLE "personas_roles" ADD COLUMN "rol_id" rol_canonico NOT NULL;