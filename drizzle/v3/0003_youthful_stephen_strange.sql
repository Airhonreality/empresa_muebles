ALTER TABLE "cuentas_financieras" ALTER COLUMN "saldo_inicial" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cuentas_financieras" ALTER COLUMN "saldo_actual" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "obligaciones_pendientes" ALTER COLUMN "monto_pagado" SET NOT NULL;