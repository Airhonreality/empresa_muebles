import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 🛰️ getDeep: Protocolo de resolución de rutas (Dot-Notation)
 * Extrae un valor de un objeto anidado usando una ruta de texto.
 */
export function getDeep(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Si la ruta no tiene puntos, resolvemos directo para máxima velocidad
  if (!path.includes('.')) return obj[path];

  return path.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : undefined;
  }, obj);
}
