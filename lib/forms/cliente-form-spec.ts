import type { EntityFieldSpec } from "@/components/veta/entity-fields";
import type { Cliente } from "@/lib/data";

export interface ClienteFormValues {
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  domicilio: string;
}

export function valoresClienteVacios(): ClienteFormValues {
  return { nombre: "", documento: "", telefono: "", email: "", domicilio: "" };
}

export function valoresClienteDesde(cliente: Cliente | undefined): ClienteFormValues {
  return {
    nombre: cliente?.nombre ?? "",
    documento: cliente?.documento ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    domicilio: cliente?.domicilio ?? "",
  };
}

/** Los campos que persiste store.clientes.crear/actualizar, listos para el spread. */
export function datosClienteParaGuardar(valores: ClienteFormValues) {
  return {
    nombre: valores.nombre.trim(),
    documento: valores.documento.trim() || null,
    telefono: valores.telefono.trim() || null,
    email: valores.email.trim() || null,
    domicilio: valores.domicilio.trim() || null,
  };
}

export const clienteFormFields: EntityFieldSpec<ClienteFormValues>[] = [
  { key: "nombre", label: "Nombre *", required: true },
  { key: "documento", label: "Documento", placeholder: "Ej: CC-1234567890" },
  { key: "telefono", label: "Teléfono", placeholder: "Ej: 3001234567" },
  { key: "email", label: "Correo electrónico", type: "email", placeholder: "Ej: cliente@correo.co" },
  { key: "domicilio", label: "Domicilio", placeholder: "Ej: Calle 1 #2-3, Bogotá", colSpan: "full" },
];
