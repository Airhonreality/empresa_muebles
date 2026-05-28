/**
 * 🧠 key.slugger.ts
 * Convierte cualquier etiqueta o cabecera de columna a una clave JSON válida en snake_case.
 * 
 * Ejemplo:
 * "Unidad de Medida (Um)"   → "unidad_de_medida_um"
 * "Precio Público ($)"      → "precio_publico"
 * "Modelo 3D (.glb / .obj)" → "modelo_3d_glb_obj"
 */
export function toSlug(label: string): string {
  if (!label) return 'campo_sin_nombre';
  
  return label
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos y diacríticos
    .replace(/[^a-z0-9\s_]/g, '')                     // Quitar caracteres especiales
    .trim()
    .replace(/\s+/g, '_')                             // Reemplazar espacios múltiples por un solo guión bajo
    .replace(/_+/g, '_')                              // Reemplazar múltiples guiones bajos por uno solo
    .replace(/^_+|_+$/g, '');                         // Quitar guiones bajos al inicio o final
}
