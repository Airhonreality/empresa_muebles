import { normalizarNumeroTexto } from './numero'
import { parteEnteraDb } from './dinero'

/**
 * Formato de moneda COP (Pesos Colombianos).
 * Convierte número o string a formato con símbolo de moneda.
 */
export function formatCurrency(amount: string | number, fractionDigits: number = 0): string {
  // t-196: parte entera, no quitar todo lo que no sea dígito ("250000.00" se volvía ×100).
  const n = typeof amount === 'string' ? parseInt(parteEnteraDb(amount), 10) : amount;
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
 *
 * t-175 (2026-09-30): si `num` llega como string, se normaliza con `normalizarNumeroTexto` antes
 * de parsear -- un `parseFloat` directo sobre un string YA formateado con separador de miles
 * (ej. "1.000.000") se detiene en el primer "." extra y da 1, un corte de magnitud silencioso.
 * Esta función no tenía ningún llamador activo cuando se detectó (código muerto), pero es
 * exactamente el patrón que explica el síntoma reportado de un monto que se ve recortado.
 */
export function formatNumber(num: number | string, fractionDigits: number = 0): string {
  const n = typeof num === 'string' ? parseFloat(normalizarNumeroTexto(num)) : num;
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

/** Texto que muestran las pantallas públicas cuando el parámetro `precio_asesoria_3d` no existe o no es numérico. */
export const PRECIO_ASESORIA_3D_SIN_DATO = 'tarifa vigente'

/**
 * Formatea el precio de asesoría 3D leído del parámetro `precio_asesoria_3d`.
 * `null` (parámetro ausente o inválido) NO se reemplaza por un precio inventado: devuelve
 * `PRECIO_ASESORIA_3D_SIN_DATO`.
 */
export function formatearPrecioAsesoria3d(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return PRECIO_ASESORIA_3D_SIN_DATO
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}
