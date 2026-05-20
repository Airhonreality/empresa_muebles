import { FieldType } from '../types';

/**
 * 🧠 type.detector.ts
 * Infiere el FieldType más adecuado analizando los primeros 50 valores no vacíos de una columna.
 */
export function detectType(values: string[]): FieldType {
  const sample = values.filter(v => v !== undefined && v !== null && v.trim() !== '').slice(0, 50);
  if (!sample.length) return 'text';

  // 1. Inferencia de Booleanos (soporta español, inglés y portugués)
  const isBool = sample.every(v => /^(si|no|yes|sim|não|true|false|1|0)$/i.test(v.trim()));
  if (isBool) return 'boolean';

  // 2. Inferencia de Números (incluye formatos con comas o puntos decimales)
  const isNum = sample.every(v => /^-?\d+([.,]\d+)?$/.test(v.trim()));
  if (isNum) return 'number';

  // 3. Inferencia de Fechas (formato común YYYY-MM-DD o YYYY/MM/DD)
  const isDate = sample.every(v => {
    const trimmed = v.trim();
    if (!/^\d{4}[-/]\d{2}[-/]\d{2}/.test(trimmed)) return false;
    const parsed = Date.parse(trimmed);
    return !isNaN(parsed);
  });
  if (isDate) return 'date';

  // 4. Inferencia de Textarea (textos descriptivos largos)
  const hasLongVal = sample.some(v => v.length > 120);
  if (hasLongVal) return 'textarea';

  return 'text';
}
