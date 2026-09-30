-- t-176: switch propio de la penalidad del 10 % (incumplimiento definitivo, abandono de obra,
-- falta de pago del anticipo). NO comparte columna con el 5 %: son cláusulas distintas, con
-- desarrollo y_switch independientes, y apagado el 5 % tiene que dejar vivo el 10 %.
--
-- DEFAULT true y NOT NULL: la cláusula se pacta, y un contrato ya firmado tiene que seguir
-- saliendo completo al reimprimirse aunque el código se actualice después.
ALTER TABLE "contratos" ADD COLUMN "aplica_penalidad_definitiva" boolean DEFAULT true NOT NULL;
