import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  onSave: (data: T) => Promise<void> | void;
  delay?: number;
  saveOnUnmount?: boolean;
}

/**
 * 🛠️ HOOK: useAutoSave.ts
 * ────────────
 * CAPA: Hooks (Shared Utilities)
 * 
 * 🎯 OBJETIVO:
 * - Realizar el guardado automático de datos (debounced) asociándolos de forma atómica a una clave contextual.
 * - Resuelve condiciones de carrera (race conditions): si la clave cambia, ejecuta el guardado pendiente
 *   de la clave anterior de forma inmediata antes de limpiar la cola.
 * - Ejecuta el guardado al desmontar el componente (evita pérdida de datos en navegaciones atrás/cambio de pestaña).
 */
export function useAutoSave<T>({
  key,
  data,
  onSave,
  delay = 1500,
  saveOnUnmount = true,
}: UseAutoSaveOptions<T>) {
  const latestData = useRef<T>(data);
  const latestKey = useRef<string>(key);
  const latestOnSave = useRef(onSave);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasPendingChanges = useRef<boolean>(false);

  // Mantener referencias actualizadas de la función de persistencia
  useEffect(() => {
    latestOnSave.current = onSave;
  }, [onSave]);

  // Manejar el cambio de datos en el mismo contexto
  useEffect(() => {
    if (latestKey.current === key) {
      if (JSON.stringify(latestData.current) !== JSON.stringify(data)) {
        latestData.current = data;
        hasPendingChanges.current = true;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          flush();
        }, delay);
      }
    }
  }, [data, delay, key]);

  // Ejecutar el guardado pendiente (flush) de forma síncrona/inmediata
  const flush = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (hasPendingChanges.current) {
      latestOnSave.current(latestData.current);
      hasPendingChanges.current = false;
    }
  };

  // Manejar el cambio de contexto (clave) o el desmontado
  useEffect(() => {
    if (latestKey.current !== key) {
      flush();
      latestKey.current = key;
      latestData.current = data;
      hasPendingChanges.current = false;
    }

    return () => {
      if (saveOnUnmount) {
        flush();
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    };
  }, [key, saveOnUnmount]); // eslint-disable-line react-hooks/exhaustive-deps

  return { flush };
}
