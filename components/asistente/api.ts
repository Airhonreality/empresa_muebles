'use client';

/** Llamada JSON a /api/asistente/**. Devuelve el cuerpo tal cual lo envía el servidor (sin claves). */
export async function llamarAsistente<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'No hay conexión con el servidor. Intenta de nuevo.' } as T & { error?: string } };
  }
}
