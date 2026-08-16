/**
 * Formato de moneda COP (Pesos Colombianos).
 * Convierte número o string a formato con símbolo de moneda.
 */
export function formatCurrency(amount: string | number, fractionDigits: number = 0): string {
  const n = typeof amount === 'string' ? parseInt(amount.replace(/[^\d]/g, ''), 10) : amount;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

/**
 * Formato de número con miles separados.
 */
export function formatNumber(num: number | string, fractionDigits: number = 0): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}
