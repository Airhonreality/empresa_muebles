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

/**
 * Formato de fecha relativa en español (ej: "hace 3 horas", "hace 2 días").
 * Fallback a fecha absoluta para fechas muy antiguas.
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '—';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHour < 24) return `hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
  if (diffDay < 7) return `hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`;
  if (diffWeek < 4) return `hace ${diffWeek} ${diffWeek === 1 ? 'semana' : 'semanas'}`;
  if (diffMonth < 12) return `hace ${diffMonth} ${diffMonth === 1 ? 'mes' : 'meses'}`;

  // Fallback a fecha absoluta para fechas antiguas
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}
