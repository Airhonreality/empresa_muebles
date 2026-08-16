'use client'
// Provider de React Context para el store de datos (§3.1d, plan_f10_migracion.md;
// reactividad multi-usuario revisada en t-132 / m07b_reactividad_multiusuario.md).
// Reemplaza el singleton viejo de store.ts para el árbol de componentes cliente:
// - modo 'mock': construye createMockStore() una sola vez (idéntico al comportamiento anterior).
// - modo 'drizzle': recibe el snapshot inicial ya hidratado por el layout raíz (Server Component,
//   sin loading flicker) y mantiene la reactividad multi-usuario con tres piezas:
//   1. Long-polling acotado + LISTEN/NOTIFY de Postgres (longPollVersionAction) — reemplaza el
//      setInterval(3s) ciego de t-131, sin re-consultar la base en loop.
//   2. Elección de pestaña líder (navigator.locks) + BroadcastChannel — solo la pestaña líder
//      mantiene el long-poll abierto; reparte snapshots y señales de actividad a sus hermanas.
//   3. Pausa real por inactividad — sin actividad humana (en NINGUNA pestaña del navegador)
//      durante IDLE_TIMEOUT_MS, se deja de abrir long-polls hasta que vuelva actividad, y al
//      volver se hace un catch-up puntual antes de reabrir el ciclo.
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { DataStore } from './contracts'
import type { StoreSnapshot } from './snapshot'
import { createMockStore } from './mock-store'
import { createDrizzleStore } from './drizzle-impl'
import { fetchSnapshotAction } from './actions/hydrate'
import { longPollVersionAction } from './actions/longpoll'

const DataStoreContext = createContext<DataStore | null>(null)

const LEADER_LOCK_NAME = 'veta-erp-longpoll-leader'
const BROADCAST_CHANNEL_NAME = 'veta_erp_reactividad'
const IDLE_TIMEOUT_MS = 12 * 60 * 1000 // 12 min sin actividad humana (ninguna pestaña) -> pausa
const ACTIVITY_BROADCAST_THROTTLE_MS = 5000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const

type BroadcastMessage =
  | { type: 'snapshot'; snapshot: StoreSnapshot }
  | { type: 'activity'; at: number }

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function DataStoreProvider({
  children,
  mode,
  initialSnapshot,
}: {
  children: React.ReactNode
  mode: 'mock' | 'drizzle'
  initialSnapshot?: StoreSnapshot
}) {
  const [handle] = useState(() => {
    if (mode === 'drizzle' && initialSnapshot) {
      return createDrizzleStore(initialSnapshot)
    }
    return { store: createMockStore(), applySnapshot: () => {} }
  })
  const versionRef = useRef<string>(initialSnapshot?.version ?? '0')

  useEffect(() => {
    if (mode !== 'drizzle') return
    if (typeof window === 'undefined') return

    let cancelled = false
    let lastActivityAt = Date.now()
    let lastActivityBroadcastAt = 0

    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(BROADCAST_CHANNEL_NAME) : null

    function applyRemoteSnapshot(snapshot: StoreSnapshot): void {
      if (cancelled || snapshot.version === versionRef.current) return
      versionRef.current = snapshot.version
      handle.applySnapshot(snapshot)
    }

    function broadcastSnapshot(snapshot: StoreSnapshot): void {
      channel?.postMessage({ type: 'snapshot', snapshot } satisfies BroadcastMessage)
    }

    function onLocalActivity(): void {
      const now = Date.now()
      lastActivityAt = now
      if (now - lastActivityBroadcastAt > ACTIVITY_BROADCAST_THROTTLE_MS) {
        lastActivityBroadcastAt = now
        channel?.postMessage({ type: 'activity', at: now } satisfies BroadcastMessage)
      }
    }

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onLocalActivity, { passive: true })
    }

    if (channel) {
      channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
        const msg = event.data
        if (msg.type === 'snapshot') {
          applyRemoteSnapshot(msg.snapshot)
        } else if (msg.type === 'activity' && msg.at > lastActivityAt) {
          lastActivityAt = msg.at
        }
      }
    }

    async function catchUp(): Promise<void> {
      // Deliberadamente incondicional: fetchVersionTokenAction() es una aproximación barata
      // que no cubre las 64 tablas de negocio (ver comentario en hydrate.ts), así que comparar
      // versiones acá podría saltarse un cambio real ocurrido en una tabla fuera de esa lista.
      // catchUp() solo corre en dos momentos poco frecuentes (arranque del líder, reanudar de
      // una pausa por inactividad) — el costo de traer el snapshot completo siempre es
      // aceptable ahí, a cambio de no tener puntos ciegos.
      try {
        const snapshot = await fetchSnapshotAction()
        if (cancelled) return
        versionRef.current = snapshot.version
        handle.applySnapshot(snapshot)
        broadcastSnapshot(snapshot)
      } catch (err) {
        console.error('Catch-up de reactividad falló, se reintenta en el próximo ciclo', err)
      }
    }

    function waitForActivity(): Promise<void> {
      return new Promise((resolve) => {
        const check = () => {
          if (cancelled || Date.now() - lastActivityAt < IDLE_TIMEOUT_MS) {
            resolve()
            return
          }
          setTimeout(check, 1000)
        }
        check()
      })
    }

    async function runLeaderLoop(): Promise<void> {
      // Al arrancar como líder (o al salir de una pausa) primero nos ponemos al día:
      // puede haber pasado cualquier cosa mientras esta pestaña no era líder o estaba pausada.
      await catchUp()

      while (!cancelled) {
        const idleFor = Date.now() - lastActivityAt
        if (idleFor >= IDLE_TIMEOUT_MS) {
          // Nadie tocó nada en ninguna pestaña de este navegador: no abrimos long-poll.
          // waitForActivity() solo usa timers locales, cero peticiones de red mientras espera.
          await waitForActivity()
          if (cancelled) return
          await catchUp()
          continue
        }

        try {
          const result = await longPollVersionAction(versionRef.current)
          if (cancelled) return
          if (result.changed) {
            // `changed` viene de un NOTIFY real (o del atajo al suscribirse) — se refresca
            // siempre, sin volver a comparar versiones (esa comparación es la que tiene el
            // punto ciego de las tablas fuera de fetchVersionTokenAction()).
            const snapshot = await fetchSnapshotAction()
            if (cancelled) return
            versionRef.current = snapshot.version
            handle.applySnapshot(snapshot)
            broadcastSnapshot(snapshot)
          }
          // Si !result.changed, el long-poll volvió por timeout sin cambios reales: se
          // reabre de inmediato, sin esperar nada adicional.
        } catch (err) {
          console.error('Long-poll de reactividad falló, reintentando en unos segundos', err)
          await sleep(2000)
        }
      }
    }

    // Elección de pestaña líder: solo la pestaña que sostiene este lock corre el long-poll.
    // navigator.locks libera el lock automáticamente cuando la pestaña se cierra/navega —
    // otra pestaña en espera lo toma sola, sin protocolo custom de heartbeat.
    if ('locks' in navigator) {
      void navigator.locks
        .request(LEADER_LOCK_NAME, async () => {
          if (cancelled) return
          await runLeaderLoop()
        })
        .catch((err: unknown) => {
          if (!cancelled) console.error('No se pudo adquirir el lock de líder de reactividad', err)
        })
    } else {
      // Navegador sin soporte de navigator.locks: cada pestaña corre su propio long-poll.
      void runLeaderLoop()
    }

    return () => {
      cancelled = true
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, onLocalActivity)
      }
      if (channel) {
        channel.onmessage = null
        channel.close()
      }
    }
  }, [mode, handle])

  return <DataStoreContext.Provider value={handle.store}>{children}</DataStoreContext.Provider>
}

export function useDataStoreContext(): DataStore {
  const store = useContext(DataStoreContext)
  if (!store) {
    throw new Error('useDataStore() se llamó fuera de <DataStoreProvider>. Envolvé el árbol en app/layout.tsx.')
  }
  return store
}
