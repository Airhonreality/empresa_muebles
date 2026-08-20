-- Kanban comercial bidireccional (2026-08-19): cada columna permite avanzar Y retroceder
-- un paso dentro del corredor canónico — enviada→activa, en_contrato→negociacion,
-- produccion→pre_produccion, entregado→produccion.
-- Actualiza la matriz transiciones_proyecto (parametros) para alinearla con
-- ACCIONES_POR_ESTADO de app/erp/comercial/page.tsx. Migración de datos, no de schema.
INSERT INTO "parametros" ("clave", "grupo", "tipo", "valor_numeric", "valor_texto", "valor_booleano", "unidad", "descripcion", "vigente_desde", "updated_at")
VALUES (
  'transiciones_proyecto',
  'comercial',
  'texto',
  NULL,
  '{"activa":["enviada","perdida","cancelada"],"enviada":["activa","negociacion","en_contrato","perdida","cancelada"],"negociacion":["en_contrato","enviada","perdida","cancelada"],"en_contrato":["pre_produccion","retoma","negociacion","perdida","cancelada"],"retoma":["en_contrato","pre_produccion","perdida","cancelada"],"pre_produccion":["produccion","retoma","cancelada"],"produccion":["entregado","retoma","pre_produccion","cancelada"],"entregado":["produccion","perdida","cancelada"],"perdida":[],"cancelada":[]}',
  NULL,
  NULL,
  'Matriz de transiciones válidas del kanban comercial (C3) - Alineado con ACCIONES_POR_ESTADO (bidireccional 2026-08-19)',
  now(),
  now()
)
ON CONFLICT ("clave") DO UPDATE SET
  "valor_texto" = EXCLUDED."valor_texto",
  "descripcion" = EXCLUDED."descripcion",
  "updated_at" = now();