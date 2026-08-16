'use server'
// Long-polling con LISTEN/NOTIFY de Postgres (t-132, ver arnes/lineas/ola7/tecnico/m07b_reactividad_multiusuario.md).
// Reemplaza el setInterval(3s) ciego de t-131: en vez de "¿pasó algo? no." cada pocos segundos,
// esta acción se queda esperando (acotada a MAX_WAIT_MS) hasta que el trigger SQL de
// drizzle/v3/0004_veta_notify_trigger.sql avisa por el canal 'veta_changes', o hasta que
// expira el tiempo máximo — lo que ocurra primero.
import { client } from '@/lib/db/client'
import { fetchVersionTokenAction } from './hydrate'

// Acotado con margen bajo cualquier límite de duración de función de Vercel (Hobby/Pro).
// El límite real de la función se declara con `export const maxDuration` en app/layout.tsx
// (una función 'use server' no puede exportar nada que no sea una función async — Next.js lo
// rechaza en build). Verificar ese valor contra el límite configurado en el dashboard de Vercel
// antes de subir MAX_WAIT_MS.
const MAX_WAIT_MS = 20_000

export interface LongPollResult {
  // true solo si se resolvió por un NOTIFY real del trigger (o por el chequeo puntual al
  // suscribirse) — el llamador SIEMPRE debe traer el snapshot completo en ese caso, sin
  // volver a comparar `version` contra nada. false = se agotó el tiempo de espera sin novedad.
  changed: boolean
  version: string
}

/**
 * Espera hasta que el canal 'veta_changes' avise un cambio real (INSERT/UPDATE/DELETE en
 * cualquiera de las 64 tablas de negocio, vía el trigger de la migración 0004), o hasta
 * MAX_WAIT_MS. `version` viene de fetchVersionTokenAction() — una aproximación barata (no
 * cubre las 64 tablas, ver comentario en hydrate.ts) que solo se usa acá como atajo para no
 * esperar si algo ya cambió antes de suscribirse. La señal de verdad es `changed`: cuando es
 * true fue un NOTIFY real (o el atajo lo detectó), y el llamador debe refrescar sin condicionarlo
 * a comparar versiones — la comparación de versión NO alcanza para decidir esto por sí sola.
 */
export async function longPollVersionAction(clientVersion: string): Promise<LongPollResult> {
  return new Promise((resolve, reject) => {
    let settled = false
    let unlistenFn: (() => void) | undefined

    const timer = setTimeout(() => {
      void finish(false)
    }, MAX_WAIT_MS)

    async function finish(changed: boolean) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        unlistenFn?.()
      } catch {
        // el cliente de postgres puede haber cerrado la conexión de listen ya — no es fatal
      }
      try {
        const version = await fetchVersionTokenAction()
        resolve({ changed, version })
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }

    client
      .listen('veta_changes', () => {
        void finish(true)
      })
      .then(async (sub) => {
        unlistenFn = () => { void sub.unlisten() }
        // Si ya se resolvió por timeout mientras se establecía la suscripción (timeout muy corto), cerrar y salir.
        if (settled) {
          unlistenFn()
          return
        }
        // Atajo: cubre cambios ocurridos entre la última versión conocida del cliente y el
        // momento en que la suscripción quedó activa. Es un best-effort (la aproximación de
        // fetchVersionTokenAction no cubre las 64 tablas) — si no detecta nada acá, cualquier
        // escritura real en cualquier tabla sigue disparando un NOTIFY genuino más adelante.
        const current = await fetchVersionTokenAction()
        if (current !== clientVersion) await finish(true)
      })
      .catch((err) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          reject(err instanceof Error ? err : new Error(String(err)))
        }
      })
  })
}
