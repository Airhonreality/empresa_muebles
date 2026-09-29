-- Cierre de alcance del contrato (2026-09-29, aprobado por Supervisor).
--
-- Origen: un cliente real pidió 9 ajustes a la plantilla antes de firmar un contrato de
-- $73.078.700. Estos 3 campos hacen que la respuesta a 2 de ellos (fecha máxima de entrega y
-- "qué suministra cada parte") sea CONFIGURABLE en el modal, en vez de depender de texto
-- libre o de tocar los subsistemas de cronograma/actas.
--
-- 1. plazo_semanas: única fuente matemática del plazo. `plazo_ejecucion_texto` pasa a ser
--    texto derivado y deja de ser fuente — un texto libre ("4 a 5") no sirve para calcular
--    una fecha sin parsearlo, y "4 a 5" era además el default con el que se generaba.
-- 2. alcance_suministros: qué suministra Veta Dorada y qué trae el Contratante.
-- 3. anexo_propuesta_identificacion: cómo se identifica el Anexo 1 (Propuesta de Diseño y
--    Presupuesto IMPRESO que se adjunta y se manda en el mismo correo). No es una URL: una
--    URL cambia de versión entre la firma y la entrega.
--
-- Las tres son nullable y aditivas: no rompen filas existentes ni ningún read.
-- APLICAR ANTES de hacer push. Escrita a mano porque drizzle-kit generate sigue bloqueado
-- por el choque de snapshots 0010/0011 (documentado desde 2026-08-28).
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "plazo_semanas" integer;
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "alcance_suministros" text;
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "anexo_propuesta_identificacion" text;
