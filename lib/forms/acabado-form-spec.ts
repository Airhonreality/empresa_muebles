import type { EntityFieldSpec } from "@/components/veta/entity-fields";

/** Campos de texto del catálogo de acabados (t-173/t-174, 2026-09-30). La imagen
 *  (imagenTexturaUrl) y el color (colorHex, swatch) se editan aparte, no con EntityFields. */
export interface AcabadoFormValues {
  nombre: string;
  marca: string;
  familia: string;
  color: string;
  colorHex: string;
  textura: string;
}

export const acabadoFormFields: EntityFieldSpec<AcabadoFormValues>[] = [
  { key: "nombre", label: "Nombre", placeholder: "Ej: Roble blanqueado", required: true },
  { key: "marca", label: "Marca", placeholder: "Ej: Pelikano, Formica, Egger" },
  { key: "familia", label: "Familia", placeholder: "Ej: maderas" },
  { key: "color", label: "Color", placeholder: "Ej: beige claro" },
  { key: "colorHex", label: "Color (hex)", placeholder: "Ej: #E8DFCA" },
  { key: "textura", label: "Textura", placeholder: "Ej: veta abierta" },
];
