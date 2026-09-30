import type { EntityFieldSpec } from "@/components/veta/entity-fields";

/** Los 6 campos universales de ficha técnica por ítem cotizado (2026-09-22, aprobado por
 *  Supervisor). Viven en ItemVariante, no en ProductoCatalogo: la misma tabla puede estar
 *  en distinto acabado en dos cotizaciones. */
export interface FichaTecnicaValues {
  marca: string;
  referencia: string;
  color: string;
  dimensiones: string;
  acabado: string;
  espesor: string;
}

export const fichaTecnicaFormFields: EntityFieldSpec<FichaTecnicaValues>[] = [
  { key: "marca", label: "Marca", placeholder: "Ej: Duratex" },
  { key: "referencia", label: "Referencia", placeholder: "Ej: AUTO-000064" },
  { key: "color", label: "Color", placeholder: "Ej: Graffo" },
  { key: "dimensiones", label: "Dimensiones", placeholder: "Ej: 1.20 × 0.60 m" },
  { key: "acabado", label: "Acabado", placeholder: "Ej: RH con cantos rígidos 2 mm" },
  { key: "espesor", label: "Espesor", placeholder: "Ej: 18" },
];
