-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."estado_contrato" AS ENUM('borrador', 'firmado');--> statement-breakpoint
CREATE TYPE "public"."estado_proyecto" AS ENUM('activa', 'enviada', 'en_contrato', 'pre_produccion', 'produccion', 'entregado', 'perdida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."rol_empleado" AS ENUM('admin', 'comercial', 'taller', 'finanzas');--> statement-breakpoint
CREATE TYPE "public"."tipo_hito_pago" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."tipo_proyecto" AS ENUM('personalizado', 'producto_fijo');--> statement-breakpoint
CREATE TYPE "public"."tipo_usuario" AS ENUM('empleado', 'cliente');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"telefono_whatsapp" text,
	"email" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"score_conversion" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contratos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"codigo_contrato" text NOT NULL,
	"fecha_contrato" text,
	"contratante_domicilio" text,
	"plazo_ejecucion_texto" text DEFAULT '4 a 5',
	"holgura_dias" integer DEFAULT 8,
	"garantia_anios" integer DEFAULT 2,
	"objeto_items" text,
	"especificaciones_estructura" text,
	"especificaciones_herrajes" text,
	"especificaciones_mesones" text,
	"condiciones_desmonte" text,
	"valor_total" numeric(14, 2) NOT NULL,
	"estado" "estado_contrato" DEFAULT 'borrador' NOT NULL,
	"email_asunto" text,
	"email_cuerpo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contratos_codigo_contrato_unique" UNIQUE("codigo_contrato")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "espacio_variantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"nombre_espacio" text NOT NULL,
	"nombre_variante" text DEFAULT 'Inicial',
	"descripcion" text,
	"descripcion_alternativa" text,
	"activa" boolean DEFAULT false NOT NULL,
	"visible_pdf" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0,
	"jornadas_desarrollo_tecnico" numeric(8, 2) DEFAULT '0',
	"jornadas_ensamblaje_taller" numeric(8, 2) DEFAULT '0',
	"jornadas_instalacion_obra" numeric(8, 2) DEFAULT '0',
	"colores" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hitos_pago" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contrato_id" uuid NOT NULL,
	"orden" integer NOT NULL,
	"tipo" "tipo_hito_pago" NOT NULL,
	"monto_o_porcentaje" numeric(14, 2) NOT NULL,
	"razon" text,
	"fecha_limite" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolio_publico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid,
	"titulo" text NOT NULL,
	"slug" text NOT NULL,
	"categoria_espacio" text,
	"barrio" text,
	"publicado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portfolio_publico_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "imagenes_portfolio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"imagen_url" text NOT NULL,
	"descripcion" text,
	"orden" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items_variante" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variante_id" uuid NOT NULL,
	"catalogo_id" uuid,
	"nombre_personalizado" text,
	"cantidad" numeric(10, 2) DEFAULT '1' NOT NULL,
	"precio_unitario" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_linea" numeric(14, 2),
	"anulado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cuentas_financieras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"tipo" text,
	"saldo_inicial" numeric(14, 2) DEFAULT '0',
	"saldo_actual" numeric(14, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movimientos_financieros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fecha" text NOT NULL,
	"descripcion" text,
	"tipo" text NOT NULL,
	"monto" numeric(14, 2) NOT NULL,
	"estado" text DEFAULT 'asentado' NOT NULL,
	"cuenta_origen_id" uuid,
	"cuenta_destino_id" uuid,
	"obligacion_id" uuid,
	"proyecto_id" uuid,
	"contrato_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "obligaciones_pendientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"descripcion" text NOT NULL,
	"tipo" text NOT NULL,
	"monto_total" numeric(14, 2) NOT NULL,
	"monto_pagado" numeric(14, 2) DEFAULT '0',
	"fecha_vencimiento" text,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"cliente_id" uuid,
	"proveedor_id" uuid,
	"proyecto_id" uuid,
	"contrato_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"documento" text,
	"telefono" text,
	"email" text,
	"domicilio" text,
	"origen" text DEFAULT 'manual',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proveedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"nit" text,
	"categoria" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ordenes_trabajo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"codigo_orden" text NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"fecha_entrega" text,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ordenes_trabajo_codigo_orden_unique" UNIQUE("codigo_orden")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pedidos_web" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"items_snapshot" jsonb NOT NULL,
	"subtotal" numeric(14, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"direccion_entrega" text,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tareas_produccion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orden_id" uuid NOT NULL,
	"nombre_tarea" text NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"operario_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"tipo" "tipo_usuario" NOT NULL,
	"rol_empleado" "rol_empleado",
	"cliente_id" uuid,
	"nombre" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "productos_catalogo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"descripcion" text NOT NULL,
	"tipo" text,
	"unidad_medida" text DEFAULT 'ud',
	"precio_directo" numeric(14, 2),
	"precio_publico" numeric(14, 2),
	"stock_actual" integer DEFAULT 0,
	"proveedor_id" uuid,
	"imagen_url" text,
	"modelo_3d_url" text,
	"categoria_comercial" text,
	"publicado_web" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"proyecto_origen_id" uuid,
	CONSTRAINT "productos_catalogo_sku_unique" UNIQUE("sku"),
	CONSTRAINT "productos_catalogo_proyecto_origen_id_unique" UNIQUE("proyecto_origen_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proyectos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid,
	"nombre_proyecto" text NOT NULL,
	"direccion_obra" text,
	"estado" "estado_proyecto" DEFAULT 'activa' NOT NULL,
	"costos_operativos" numeric(14, 2) DEFAULT '0',
	"imprevistos_instalacion" numeric(14, 2) DEFAULT '0',
	"descuento_comercial" numeric(14, 2) DEFAULT '0',
	"ajuste_arbitrario" numeric(14, 2) DEFAULT '0',
	"garantia_anios" integer DEFAULT 2,
	"dias_entrega_estimados" integer,
	"aplica_iva" boolean DEFAULT false,
	"porcentaje_iva" numeric(5, 2) DEFAULT '19',
	"descripcion_semantica" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tipo_proyecto" "tipo_proyecto" DEFAULT 'personalizado' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contratos" ADD CONSTRAINT "contratos_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "espacio_variantes" ADD CONSTRAINT "espacio_variantes_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hitos_pago" ADD CONSTRAINT "hitos_pago_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolio_publico" ADD CONSTRAINT "portfolio_publico_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "imagenes_portfolio" ADD CONSTRAINT "imagenes_portfolio_portfolio_id_portfolio_publico_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio_publico"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items_variante" ADD CONSTRAINT "items_variante_variante_id_espacio_variantes_id_fk" FOREIGN KEY ("variante_id") REFERENCES "public"."espacio_variantes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items_variante" ADD CONSTRAINT "items_variante_catalogo_id_productos_catalogo_id_fk" FOREIGN KEY ("catalogo_id") REFERENCES "public"."productos_catalogo"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movimientos_financieros" ADD CONSTRAINT "movimientos_financieros_cuenta_origen_id_cuentas_financieras_id" FOREIGN KEY ("cuenta_origen_id") REFERENCES "public"."cuentas_financieras"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movimientos_financieros" ADD CONSTRAINT "movimientos_financieros_cuenta_destino_id_cuentas_financieras_i" FOREIGN KEY ("cuenta_destino_id") REFERENCES "public"."cuentas_financieras"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movimientos_financieros" ADD CONSTRAINT "movimientos_financieros_obligacion_id_obligaciones_pendientes_i" FOREIGN KEY ("obligacion_id") REFERENCES "public"."obligaciones_pendientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movimientos_financieros" ADD CONSTRAINT "movimientos_financieros_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movimientos_financieros" ADD CONSTRAINT "movimientos_financieros_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "obligaciones_pendientes" ADD CONSTRAINT "obligaciones_pendientes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "obligaciones_pendientes" ADD CONSTRAINT "obligaciones_pendientes_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "obligaciones_pendientes" ADD CONSTRAINT "obligaciones_pendientes_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "obligaciones_pendientes" ADD CONSTRAINT "obligaciones_pendientes_contrato_id_contratos_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "public"."contratos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedidos_web" ADD CONSTRAINT "pedidos_web_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tareas_produccion" ADD CONSTRAINT "tareas_produccion_orden_id_ordenes_trabajo_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes_trabajo"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tareas_produccion" ADD CONSTRAINT "tareas_produccion_operario_id_usuarios_id_fk" FOREIGN KEY ("operario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "productos_catalogo" ADD CONSTRAINT "productos_catalogo_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "productos_catalogo" ADD CONSTRAINT "productos_catalogo_proyecto_origen_id_proyectos_id_fk" FOREIGN KEY ("proyecto_origen_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/