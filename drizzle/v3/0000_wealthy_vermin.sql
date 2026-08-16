CREATE TYPE "public"."alojador_documento" AS ENUM('r2', 'drive_veta_erp');--> statement-breakpoint
CREATE TYPE "public"."bitacora_categoria" AS ENUM('casos_estudio', 'materiales_tecnica', 'diseno_arquitectura', 'mantenimiento');--> statement-breakpoint
CREATE TYPE "public"."causa_desfase" AS ENUM('interna', 'externa', 'cambio_contrato');--> statement-breakpoint
CREATE TYPE "public"."desenlace_check" AS ENUM('todo_bien', 'novedad', 'extremo');--> statement-breakpoint
CREATE TYPE "public"."estado_acta_entrega" AS ENUM('generada', 'enviada', 'firmada');--> statement-breakpoint
CREATE TYPE "public"."estado_caso_garantia" AS ENUM('reportado', 'diagnosticado', 'en_reparacion', 'resuelto', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."estado_contrato" AS ENUM('borrador', 'firmado');--> statement-breakpoint
CREATE TYPE "public"."estado_cuenta_cobro" AS ENUM('emitida', 'vinculada', 'pagada', 'anulada');--> statement-breakpoint
CREATE TYPE "public"."estado_instalacion" AS ENUM('programada', 'en_curso', 'instalada', 'fallida');--> statement-breakpoint
CREATE TYPE "public"."estado_novedad_critica" AS ENUM('abierta', 'en_atencion', 'resuelta', 'escalada');--> statement-breakpoint
CREATE TYPE "public"."estado_operativo_herramienta" AS ENUM('operativa', 'reparacion', 'fuera_servicio', 'necesita_reposicion');--> statement-breakpoint
CREATE TYPE "public"."estado_orden_compra_v2" AS ENUM('solicitada', 'aprobada', 'en_pago', 'pagada', 'recibida_verificada', 'rechazada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."estado_proyecto" AS ENUM('borrador', 'en_revision', 'cotizado', 'negociacion', 'en_contrato', 'desarrollo', 'aprobado_compras', 'armado', 'verificado', 'en_instalacion', 'instalado', 'entregado', 'perdida', 'cancelada', 'activa', 'enviada', 'pre_produccion', 'produccion', 'retoma');--> statement-breakpoint
CREATE TYPE "public"."estado_recepcion_material" AS ENUM('pendiente', 'recibido_verificado', 'recibido_defectuoso');--> statement-breakpoint
CREATE TYPE "public"."estado_schema_proyecto" AS ENUM('borrador', 'en_desarrollo', 'para_revision', 'aprobado_compras', 'rechazado', 'en_reproceso');--> statement-breakpoint
CREATE TYPE "public"."etapa_cronograma" AS ENUM('aprobacion', 'compras', 'ensamblaje', 'instalacion');--> statement-breakpoint
CREATE TYPE "public"."fuente_modulo_artefacto" AS ENUM('heredado_catalogo', 'dedicado_proyecto');--> statement-breakpoint
CREATE TYPE "public"."fuente_referencial" AS ENUM('electrodomestico', 'obra_civil', 'servicio_tercero', 'otro');--> statement-breakpoint
CREATE TYPE "public"."fuente_testimonio" AS ENUM('GBP', 'WhatsApp', 'Notion', 'video', 'otro');--> statement-breakpoint
CREATE TYPE "public"."linea_cronograma" AS ENUM('contractual', 'interna');--> statement-breakpoint
CREATE TYPE "public"."macro_fase_proyecto" AS ENUM('pre_venta', 'cotizacion', 'produccion', 'instalacion', 'post_venta');--> statement-breakpoint
CREATE TYPE "public"."mecanica_pago_oc" AS ENUM('anticipo_saldo', 'unico', 'subcontratacion');--> statement-breakpoint
CREATE TYPE "public"."origen_bom" AS ENUM('cotizacion', 'desarrollo');--> statement-breakpoint
CREATE TYPE "public"."origen_obligacion" AS ENUM('contrato_hito', 'proveedor', 'diseno_3d', 'nomina', 'comision', 'arriendo');--> statement-breakpoint
CREATE TYPE "public"."origen_reproceso" AS ENUM('schema', 'calidad', 'instalacion', 'garantia', 'recepcion');--> statement-breakpoint
CREATE TYPE "public"."rol_empleado" AS ENUM('admin', 'comercial', 'desarrollador', 'compras', 'taller', 'finanzas', 'supervisora_qa');--> statement-breakpoint
CREATE TYPE "public"."shop_categoria" AS ENUM('Cocinas', 'Closets', 'Estudios', 'Comedores', 'Baños');--> statement-breakpoint
CREATE TYPE "public"."tipo_cambio_contrato" AS ENUM('adicional', 'cambio', 'reproceso');--> statement-breakpoint
CREATE TYPE "public"."tipo_gate" AS ENUM('schema', 'recepcion', 'calidad');--> statement-breakpoint
CREATE TYPE "public"."tipo_hito_pago" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."tipo_modulo_artefacto" AS ENUM('imagen', 'plano_armado', 'orden_armado', 'modelo_3d');--> statement-breakpoint
CREATE TYPE "public"."tipo_orden_trabajo" AS ENUM('produccion', 'garantia');--> statement-breakpoint
CREATE TYPE "public"."tipo_proyecto" AS ENUM('personalizado', 'producto_fijo');--> statement-breakpoint
CREATE TYPE "public"."tipo_usuario" AS ENUM('empleado', 'cliente');--> statement-breakpoint
CREATE TYPE "public"."veredicto_gate" AS ENUM('aprobado', 'rechazado', 'rechazado_total', 'reproceso_parcial');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "acabados_muestras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acabado_id" uuid NOT NULL,
	"imagen_muestra_url" text,
	"disponible_web" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "actas_entrega" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"pdf_url" text,
	"estado" "estado_acta_entrega" DEFAULT 'generada' NOT NULL,
	"holgura_operativa_dias" integer DEFAULT 12 NOT NULL,
	"fotos" jsonb DEFAULT '[]'::jsonb,
	"observaciones" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "actas_entrega_proyecto_id_unique" UNIQUE("proyecto_id")
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "bitacora_articulos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"titulo" text NOT NULL,
	"extracto" text NOT NULL,
	"contenido_largo" text NOT NULL,
	"categoria" "bitacora_categoria" NOT NULL,
	"imagen_portada" text,
	"fecha_publicacion" text NOT NULL,
	"autor_id" uuid,
	"proyecto_relacionado_id" uuid,
	"publicado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bitacora_articulos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bom_material" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schema_id" uuid NOT NULL,
	"producto_id" uuid,
	"cantidad" numeric(10, 2) NOT NULL,
	"unidad" text NOT NULL,
	"origen" "origen_bom" NOT NULL,
	"homologable" boolean DEFAULT false NOT NULL,
	"item_variante_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cambios_contrato" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"tipo_cambio" "tipo_cambio_contrato" NOT NULL,
	"descripcion" text NOT NULL,
	"dispara_desfase" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "casos_garantia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"modulo_id" uuid,
	"cliente_id" uuid,
	"descripcion" text NOT NULL,
	"fotos" jsonb DEFAULT '[]'::jsonb,
	"estado" "estado_caso_garantia" DEFAULT 'reportado' NOT NULL,
	"dentro_garantia_contractual" boolean DEFAULT true NOT NULL,
	"fecha_reporte" text NOT NULL,
	"diagnostico" text,
	"solucion_aplicada" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalogo_acabados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"familia" text,
	"color" text,
	"color_hex" text,
	"textura" text,
	"precio_diferencial" numeric(14, 2),
	"imagen_textura_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalogo_producto_acabados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producto_catalogo_id" uuid NOT NULL,
	"acabado_id" uuid NOT NULL,
	"es_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"tipo" text NOT NULL,
	"padre_id" uuid,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checks_produccion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"fecha_check" text NOT NULL,
	"ratio_insumos" numeric(5, 2) NOT NULL,
	"ratio_pagos" numeric(5, 2) NOT NULL,
	"ratio_produccion" numeric(5, 2) NOT NULL,
	"desenlace_sugerido" "desenlace_check" NOT NULL,
	"desenlace_final" "desenlace_check",
	"override_justificacion" text,
	"comisiones_reducidas_pct" numeric(5, 2),
	"verificador_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "citaciones_calidad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"modulos_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estado" text DEFAULT 'citada' NOT NULL,
	"fecha" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "citas_garantia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caso_id" uuid NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"fecha" text NOT NULL,
	"diagnosticado_por" uuid,
	"resultado" text,
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
CREATE TABLE IF NOT EXISTS "comunicaciones_progreso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"tipo" text DEFAULT 'adelanto' NOT NULL,
	"contenido" text NOT NULL,
	"visible_al_cliente" boolean DEFAULT true NOT NULL,
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
	"especificaciones_desmonte" text,
	"valor_total" numeric(14, 2) NOT NULL,
	"estado" "estado_contrato" DEFAULT 'borrador' NOT NULL,
	"email_asunto" text,
	"email_cuerpo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contratos_codigo_contrato_unique" UNIQUE("codigo_contrato")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cronograma_etapas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cronograma_id" uuid NOT NULL,
	"linea" "linea_cronograma" NOT NULL,
	"etapa" "etapa_cronograma" NOT NULL,
	"fecha_ideal" text NOT NULL,
	"fecha_real" text NOT NULL,
	"estado" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cronogramas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"base_semanas" integer NOT NULL,
	"holgura_maxima_dias" integer NOT NULL,
	"promesa_semanas" integer NOT NULL,
	"fecha_fijacion" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cuentas_cobro_proveedor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"orden_compra_id" uuid,
	"obligacion_id" uuid,
	"concepto" text NOT NULL,
	"valor" numeric(14, 2) NOT NULL,
	"estado" "estado_cuenta_cobro" DEFAULT 'emitida' NOT NULL,
	"firma_digital" text NOT NULL,
	"url_documento" text,
	"fecha_emision" text NOT NULL,
	"fecha_vencimiento" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cuentas_financieras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"tipo" text,
	"saldo_inicial" numeric(14, 2) DEFAULT '0',
	"saldo_actual" numeric(14, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "desfases_cronograma" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"dias_desfase" integer NOT NULL,
	"causa" "causa_desfase" NOT NULL,
	"composicion_causal" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"motivo" text NOT NULL,
	"aplicado" boolean DEFAULT false NOT NULL,
	"decision_manual" text,
	"autorizado_por" uuid,
	"resultado_recalculo" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documentos_proyecto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"etapa" "macro_fase_proyecto" NOT NULL,
	"alojador" "alojador_documento" NOT NULL,
	"url" text NOT NULL,
	"nombre" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "espacio_variantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"nombre_espacio" text NOT NULL,
	"nombre_variante" text DEFAULT 'Inicial',
	"descripcion" text,
	"activa" boolean DEFAULT false NOT NULL,
	"visible_en_propuesta_publica" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0,
	"jornadas_desarrollo_tecnico" numeric(8, 2) DEFAULT '0',
	"jornadas_ensamblaje_taller" numeric(8, 2) DEFAULT '0',
	"jornadas_instalacion_obra" numeric(8, 2) DEFAULT '0',
	"colores" jsonb DEFAULT '[]'::jsonb,
	"fotosEspacio" jsonb DEFAULT '[]'::jsonb,
	"fotosDisenio" jsonb DEFAULT '[]'::jsonb,
	"fotosReferencia" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "estimaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"valor" numeric(14, 2) NOT NULL,
	"cantidad_modulos" integer NOT NULL,
	"duracion_estimada" text NOT NULL,
	"factor_crecimiento" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "estimaciones_proyecto_id_unique" UNIQUE("proyecto_id")
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
CREATE TABLE IF NOT EXISTS "herramientas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"estado_operativo" "estado_operativo_herramienta" DEFAULT 'operativa' NOT NULL,
	"valor" numeric(14, 2) NOT NULL,
	"foto_url" text,
	"proveedor_id" uuid,
	"orden_compra_reposicion_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE IF NOT EXISTS "imagenes_portfolio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"imagen_url" text NOT NULL,
	"descripcion" text,
	"orden" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instalaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"rango_fecha_inicio" text NOT NULL,
	"rango_fecha_fin" text NOT NULL,
	"estado" "estado_instalacion" DEFAULT 'programada' NOT NULL,
	"adelantada_por" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items_orden_compra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orden_compra_id" uuid NOT NULL,
	"producto_catalogo_id" uuid,
	"especificacion" text,
	"cantidad_esperada" integer NOT NULL,
	"recibido_cantidad" integer DEFAULT 0 NOT NULL,
	"sin_defectos" boolean DEFAULT true NOT NULL
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
CREATE TABLE IF NOT EXISTS "modulos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"espacio_variante_id" uuid,
	"nombre" text NOT NULL,
	"estado" text NOT NULL,
	"padre_id" uuid,
	"padre_linaje" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tipo_modulo" text,
	"cantidad" integer DEFAULT 1 NOT NULL,
	"horas_estimadas" numeric(8, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "modulos_artefactos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modulo_id" uuid NOT NULL,
	"tipo" "tipo_modulo_artefacto" NOT NULL,
	"fuente" "fuente_modulo_artefacto" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"orden_compra_id" uuid,
	"socio_id" uuid,
	"medio_pago" text,
	"comprobante_url" text,
	"prioridad_pago" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "novedades_criticas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"descripcion" text NOT NULL,
	"fase" text NOT NULL,
	"ventana_sla_horas" integer NOT NULL,
	"estado" "estado_novedad_critica" DEFAULT 'abierta' NOT NULL,
	"escalado_a" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "obligaciones_pendientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"descripcion" text NOT NULL,
	"origen" "origen_obligacion" NOT NULL,
	"monto_total" numeric(14, 2) NOT NULL,
	"monto_pagado" numeric(14, 2) DEFAULT '0',
	"fecha_vencimiento" text NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"cliente_id" uuid,
	"proveedor_id" uuid,
	"proyecto_id" uuid,
	"contrato_id" uuid,
	"persona_id" uuid,
	"hito_id" uuid,
	"orden_compra_id" uuid,
	"base_calculo" text,
	"porcentaje" numeric(5, 2),
	"tipo_comision" text,
	"cantidad_modulos" integer,
	"desfase_id" uuid,
	"periodicidad" text,
	"deduccion_diseno_3d" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ordenes_compra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo_orden" text NOT NULL,
	"proyecto_id" uuid,
	"proveedor_id" uuid NOT NULL,
	"monto_total" numeric(14, 2) NOT NULL,
	"anticipo_monto" numeric(14, 2),
	"estado" "estado_orden_compra_v2" DEFAULT 'solicitada' NOT NULL,
	"mecanica_pago" "mecanica_pago_oc" NOT NULL,
	"fecha_recepcion_esperada" text,
	"tiempo_entrega_dias" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ordenes_compra_codigo_orden_unique" UNIQUE("codigo_orden")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ordenes_trabajo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"codigo_orden" text NOT NULL,
	"pedido_web_id" uuid,
	"tipo" "tipo_orden_trabajo" DEFAULT 'produccion' NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"fecha_entrega" text,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ordenes_trabajo_codigo_orden_unique" UNIQUE("codigo_orden")
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
CREATE TABLE IF NOT EXISTS "pedidos_web" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"proyecto_id" uuid,
	"total_pedido" numeric(14, 2) NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"documento" text,
	"telefono" text,
	"foto_url" text,
	"email" text,
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
CREATE TABLE IF NOT EXISTS "portafolio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descripcion_comercial" text,
	"categoria_espacio" text NOT NULL,
	"materiales_destacados" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"precio_referencial" text,
	"imagen_portafolio_url" text,
	"galeria_portafolio_url" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"barrio" text,
	"tipo_proyecto" text,
	"publicado" boolean DEFAULT false NOT NULL,
	"destacado" boolean DEFAULT false NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portafolio_slug_unique" UNIQUE("slug")
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
	"anulado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"proyecto_origen_id" uuid,
	CONSTRAINT "productos_catalogo_sku_unique" UNIQUE("sku"),
	CONSTRAINT "productos_catalogo_proyecto_origen_id_unique" UNIQUE("proyecto_origen_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "productos_tienda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalogo_id" uuid NOT NULL,
	"descripcion_diseno" text,
	"imagen_principal_url" text,
	"categoria" "shop_categoria" NOT NULL,
	"visible_en_tienda" boolean DEFAULT false NOT NULL,
	"valor_tienda" numeric(14, 2) NOT NULL,
	"inventario_disponible" integer DEFAULT 0 NOT NULL,
	"calificacion_promedio" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "productos_tienda_componentes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producto_tienda_id" uuid NOT NULL,
	"catalogo_id" uuid NOT NULL,
	"cantidad" numeric(10, 2) DEFAULT '1' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proveedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"nit" text,
	"categoria" text,
	"telefono_comercial" text,
	"direccion_despacho" text,
	"ciudad" text,
	"medio_pago" text,
	"dias_entrega_default" integer,
	"transportadora" text,
	"tarifa_flete" numeric(14, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proyectos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid,
	"comercial_id" uuid,
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
	"verificador_id" uuid,
	"fecha_entrada_desarrollo" text,
	"comercial_vendedor_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tipo_proyecto" "tipo_proyecto" DEFAULT 'personalizado' NOT NULL
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
CREATE TABLE IF NOT EXISTS "recepciones_material" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orden_compra_id" uuid NOT NULL,
	"proyecto_id" uuid,
	"check_pedido_bien" boolean DEFAULT false NOT NULL,
	"check_despacho_bien" boolean DEFAULT false NOT NULL,
	"check_material" boolean DEFAULT false NOT NULL,
	"estado" "estado_recepcion_material" DEFAULT 'pendiente' NOT NULL,
	"descripcion_defecto" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registros_gate_caja" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orden_compra_id" uuid NOT NULL,
	"fecha" text NOT NULL,
	"monto_solicitado" numeric(14, 2) NOT NULL,
	"saldo_disponible" numeric(14, 2) NOT NULL,
	"bloqueado" boolean DEFAULT false NOT NULL,
	"decision" text,
	"resolucion" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reprocesos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"origen" "origen_reproceso" NOT NULL,
	"modulo_id" uuid,
	"culpable" text,
	"granularidad" text,
	"descripcion" text,
	"estado" text DEFAULT 'abierto' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "retomas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"medidas" jsonb,
	"fotos" jsonb DEFAULT '[]'::jsonb,
	"anomalia_detectada" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "retomas_proyecto_id_unique" UNIQUE("proyecto_id")
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
CREATE TABLE IF NOT EXISTS "schemas_proyecto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"estado" "estado_schema_proyecto" DEFAULT 'borrador' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"aprobado_en" timestamp
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
CREATE TABLE IF NOT EXISTS "testimonios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contenido" text NOT NULL,
	"rating" integer,
	"curado" boolean DEFAULT false NOT NULL,
	"aprobado" boolean DEFAULT false NOT NULL,
	"publicado" boolean DEFAULT false NOT NULL,
	"fuente" "fuente_testimonio" NOT NULL,
	"barrio" text,
	"tipo_proyecto" text,
	"url_fuente" text,
	"fecha_publicacion" text,
	"cliente_id" uuid,
	"proyecto_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"persona_id" uuid,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"tipo_gate" "tipo_gate" NOT NULL,
	"veredicto" "veredicto_gate" NOT NULL,
	"verificador_id" uuid NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "acabados_muestras" ADD CONSTRAINT "acabados_muestras_acabado_id_catalogo_acabados_id_fk" FOREIGN KEY ("acabado_id") REFERENCES "public"."catalogo_acabados"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actas_entrega" ADD CONSTRAINT "actas_entrega_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_usuarios_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bitacora_articulos" ADD CONSTRAINT "bitacora_articulos_autor_id_personas_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bitacora_articulos" ADD CONSTRAINT "bitacora_articulos_proyecto_relacionado_id_proyectos_id_fk" FOREIGN KEY ("proyecto_relacionado_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_material" ADD CONSTRAINT "bom_material_schema_id_schemas_proyecto_id_fk" FOREIGN KEY ("schema_id") REFERENCES "public"."schemas_proyecto"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_material" ADD CONSTRAINT "bom_material_producto_id_productos_catalogo_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos_catalogo"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bom_material" ADD CONSTRAINT "bom_material_item_variante_id_items_variante_id_fk" FOREIGN KEY ("item_variante_id") REFERENCES "public"."items_variante"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cambios_contrato" ADD CONSTRAINT "cambios_contrato_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casos_garantia" ADD CONSTRAINT "casos_garantia_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casos_garantia" ADD CONSTRAINT "casos_garantia_modulo_id_modulos_id_fk" FOREIGN KEY ("modulo_id") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "casos_garantia" ADD CONSTRAINT "casos_garantia_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "catalogo_producto_acabados" ADD CONSTRAINT "catalogo_producto_acabados_producto_catalogo_id_fk" FOREIGN KEY ("producto_catalogo_id") REFERENCES "public"."productos_catalogo"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "catalogo_producto_acabados" ADD CONSTRAINT "catalogo_producto_acabados_acabado_id_catalogo_acabados_id_fk" FOREIGN KEY ("acabado_id") REFERENCES "public"."catalogo_acabados"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categorias" ADD CONSTRAINT "categorias_padre_id_categorias_id_fk" FOREIGN KEY ("padre_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checks_produccion" ADD CONSTRAINT "checks_produccion_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "checks_produccion" ADD CONSTRAINT "checks_produccion_verificador_id_personas_id_fk" FOREIGN KEY ("verificador_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "citaciones_calidad" ADD CONSTRAINT "citaciones_calidad_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "citas_garantia" ADD CONSTRAINT "citas_garantia_caso_id_casos_garantia_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos_garantia"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "citas_garantia" ADD CONSTRAINT "citas_garantia_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comunicaciones_progreso" ADD CONSTRAINT "comunicaciones_progreso_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contratos" ADD CONSTRAINT "contratos_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cronograma_etapas" ADD CONSTRAINT "cronograma_etapas_cronograma_id_cronogramas_id_fk" FOREIGN KEY ("cronograma_id") REFERENCES "public"."cronogramas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cronogramas" ADD CONSTRAINT "cronogramas_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cuentas_cobro_proveedor" ADD CONSTRAINT "cuentas_cobro_proveedor_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cuentas_cobro_proveedor" ADD CONSTRAINT "cuentas_cobro_proveedor_orden_compra_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cuentas_cobro_proveedor" ADD CONSTRAINT "cuentas_cobro_proveedor_obligacion_id_fk" FOREIGN KEY ("obligacion_id") REFERENCES "public"."obligaciones_pendientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "desfases_cronograma" ADD CONSTRAINT "desfases_cronograma_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "desfases_cronograma" ADD CONSTRAINT "desfases_cronograma_autorizado_por_personas_id_fk" FOREIGN KEY ("autorizado_por") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documentos_proyecto" ADD CONSTRAINT "documentos_proyecto_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "espacios_artefactos" ADD CONSTRAINT "espacios_artefactos_espacio_variante_id_espacio_variantes_id_fk" FOREIGN KEY ("espacio_variante_id") REFERENCES "public"."espacio_variantes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "estimaciones" ADD CONSTRAINT "estimaciones_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "herramientas" ADD CONSTRAINT "herramientas_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "herramientas" ADD CONSTRAINT "herramientas_orden_compra_reposicion_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_reposicion_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "imagenes_portfolio" ADD CONSTRAINT "imagenes_portfolio_portfolio_id_portfolio_publico_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio_publico"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instalaciones" ADD CONSTRAINT "instalaciones_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instalaciones" ADD CONSTRAINT "instalaciones_adelantada_por_checks_produccion_id_fk" FOREIGN KEY ("adelantada_por") REFERENCES "public"."checks_produccion"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_orden_compra_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_producto_catalogo_id_fk" FOREIGN KEY ("producto_catalogo_id") REFERENCES "public"."productos_catalogo"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "modulos" ADD CONSTRAINT "modulos_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modulos" ADD CONSTRAINT "modulos_espacio_variante_id_espacio_variantes_id_fk" FOREIGN KEY ("espacio_variante_id") REFERENCES "public"."espacio_variantes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modulos" ADD CONSTRAINT "modulos_padre_id_modulos_id_fk" FOREIGN KEY ("padre_id") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modulos_artefactos" ADD CONSTRAINT "modulos_artefactos_modulo_id_modulos_id_fk" FOREIGN KEY ("modulo_id") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "movimientos_financieros" ADD CONSTRAINT "movimientos_financieros_orden_compra_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "novedades_criticas" ADD CONSTRAINT "novedades_criticas_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "novedades_criticas" ADD CONSTRAINT "novedades_criticas_escalado_a_personas_id_fk" FOREIGN KEY ("escalado_a") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "obligaciones_pendientes" ADD CONSTRAINT "obligaciones_pendientes_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "obligaciones_pendientes" ADD CONSTRAINT "obligaciones_pendientes_hito_id_hitos_pago_id_fk" FOREIGN KEY ("hito_id") REFERENCES "public"."hitos_pago"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "obligaciones_pendientes" ADD CONSTRAINT "obligaciones_pendientes_orden_compra_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_pedido_web_id_pedidos_web_id_fk" FOREIGN KEY ("pedido_web_id") REFERENCES "public"."pedidos_web"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "pedidos_web" ADD CONSTRAINT "pedidos_web_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedidos_web" ADD CONSTRAINT "pedidos_web_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "portafolio" ADD CONSTRAINT "portafolio_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "productos_tienda" ADD CONSTRAINT "productos_tienda_catalogo_id_productos_catalogo_id_fk" FOREIGN KEY ("catalogo_id") REFERENCES "public"."productos_catalogo"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "productos_tienda_componentes" ADD CONSTRAINT "prod_tienda_componentes_producto_tienda_id_fk" FOREIGN KEY ("producto_tienda_id") REFERENCES "public"."productos_tienda"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "productos_tienda_componentes" ADD CONSTRAINT "prod_tienda_componentes_catalogo_id_fk" FOREIGN KEY ("catalogo_id") REFERENCES "public"."productos_catalogo"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_comercial_id_personas_id_fk" FOREIGN KEY ("comercial_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_verificador_id_personas_id_fk" FOREIGN KEY ("verificador_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_comercial_vendedor_id_personas_id_fk" FOREIGN KEY ("comercial_vendedor_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "recepciones_material" ADD CONSTRAINT "recepciones_material_orden_compra_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recepciones_material" ADD CONSTRAINT "recepciones_material_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registros_gate_caja" ADD CONSTRAINT "registros_gate_caja_orden_compra_id_ordenes_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."ordenes_compra"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reprocesos" ADD CONSTRAINT "reprocesos_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reprocesos" ADD CONSTRAINT "reprocesos_modulo_id_modulos_id_fk" FOREIGN KEY ("modulo_id") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "retomas" ADD CONSTRAINT "retomas_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schemas_proyecto" ADD CONSTRAINT "schemas_proyecto_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "verificaciones" ADD CONSTRAINT "verificaciones_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verificaciones" ADD CONSTRAINT "verificaciones_verificador_id_personas_id_fk" FOREIGN KEY ("verificador_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
