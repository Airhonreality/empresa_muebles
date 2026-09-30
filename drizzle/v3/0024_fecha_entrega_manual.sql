-- t-173: fecha de entrega escrita a mano.
--
-- Se reemplaza el cálculo de la fecha máxima (plazo + holgura, saltando festivos con un
-- calendario oficial por año) por un campo de texto que se llena en el modal. Es el dato que
-- sostiene la mora del 5 %: sin fecha, el numeral de penalidad no tiene contra qué aplicarse.
--
-- Nullable y sin default a propósito: los contratos ya firmados no tienen fecha de entrega
-- porque la columna no existía, y esta migración no puede inventar una ni tocar sus filas.
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "fecha_entrega_maxima" text;
