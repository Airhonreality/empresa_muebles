-- t-177: declaración, no cálculo. El IVA ya se suma al total del proyecto (proyectos.aplica_iva /
-- porcentaje_iva) y el valorTotal del contrato es ese total. Este campo solo decide si el contrato
-- lo dice por escrito.
--
-- DEFAULT false a propósito: un contrato YA FIRMADO debe reimprimirse exactamente igual. Con true,
-- los contratos suscritos antes de esta migración ganarían al reimprimirse una frase que nunca
-- se pactó, y eso también es modificar un documento firmado.
ALTER TABLE "contratos" ADD COLUMN "incluye_iva" boolean DEFAULT false NOT NULL;
