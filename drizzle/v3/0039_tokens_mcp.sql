-- 0039 · Servidor MCP del asistente (t-200 §6.2): tabla de tokens personales, ADITIVA.
-- Solo guarda el hash SHA-256 del token. Re-ejecutable (idempotente): IF NOT EXISTS en tabla e índice,
-- FK dentro de bloque DO que ignora duplicate_object. UNIQUE en la definición de la tabla.
-- Aplicar con: npx tsx scripts/apply-sql-migration.ts drizzle/v3/0039_tokens_mcp.sql --apply [DATABASE_URL_V3_PREVIEW]
-- Verificar con: npx tsx scripts/verify-0039-tokens-mcp.ts [DATABASE_URL | DATABASE_URL_V3_PREVIEW]

CREATE TABLE IF NOT EXISTS "tokens_mcp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"etiqueta" text NOT NULL,
	"hash" text NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"ultimo_uso_en" timestamp,
	"revocado_en" timestamp,
	CONSTRAINT "tokens_mcp_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tokens_mcp" ADD CONSTRAINT "tokens_mcp_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;