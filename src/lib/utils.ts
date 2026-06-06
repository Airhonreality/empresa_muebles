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

/**
 * Realiza una búsqueda predictiva y flexible sobre una lista de elementos.
 * Divide la consulta en palabras (tokens) y verifica si cada token coincide de forma parcial
 * con los campos buscables. Calcula una puntuación de relevancia para ordenar los resultados.
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string
): T[] {
  if (!query) return items;

  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  
  if (queryTokens.length === 0) return items;

  const scoredItems = items
    .map(item => {
      const itemText = getSearchText(item).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      let matchedTokens = 0;
      let score = 0;
      
      for (const token of queryTokens) {
        const index = itemText.indexOf(token);
        if (index !== -1) {
          matchedTokens++;
          // Puntuación más alta si coincide al principio de la cadena
          score += 10 - Math.min(9, index / 10);
          // Bonus si coincide con el inicio de una palabra
          const isWordStart = index === 0 || itemText[index - 1] === ' ';
          if (isWordStart) {
            score += 5;
          }
        }
      }

      return { item, matchedTokens, score };
    })
    // Filtrar estrictamente solo elementos que coincidan con TODOS los tokens de la consulta
    .filter(res => res.matchedTokens === queryTokens.length)
    .sort((a, b) => b.score - a.score)
    .map(res => res.item);

  return scoredItems;
}

