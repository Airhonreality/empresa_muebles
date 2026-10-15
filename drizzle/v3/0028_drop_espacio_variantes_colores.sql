-- t-174/t-177 (2026-10-15): elimina espacio_variantes.colores (jsonb), el campo fantasma que
-- sobrevivió a la migración de t-172/t-175 hacia la fuente de verdad relacional
-- espacio_variante_acabados -> catalogo_acabados. Verificado en ambas bases: las 179 filas de
-- prod tienen colores = [] (vacío), así que el drop no pierde datos.
-- Se escribe a mano (mismo método que 0012/0014/0015/0019/0020/0021/0027): drizzle-kit generate
-- sigue bloqueado por el choque de snapshots 0010/0011 (documentado desde 2026-08-28).
-- ORDEN: NO aplicar antes de hacer push. El código en producción todavía selecciona colores;
-- el drop se ejecuta recién después de que el deploy con el código nuevo quede confirmado en vivo.
ALTER TABLE "espacio_variantes" DROP COLUMN IF EXISTS "colores";
