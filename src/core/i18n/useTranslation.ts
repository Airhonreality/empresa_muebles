'use client';

import { useAppState } from '@/context/AppContext';
import { es, en, Dictionary } from './dictionaries';

export function useTranslation() {
  const { state } = useAppState();
  
  // 🛡️ ACCESO SEGURO: El locale puede venir de la config del sistema o ser 'es' por defecto
  const locale = (state.system as any)?.config?.locale || 'es';

  const dictionary: Dictionary = locale === 'en' ? en : es;

  /**
   * Translate a key using dot notation (e.g., 'common.save')
   */
  const t = (path: string): string => {
    if (!path || typeof path !== 'string') return '';
    const keys = path.split('.');
    let current: any = dictionary;

    for (const key of keys) {
      if (current[key] === undefined) {
        return path; // Return the path itself if key not found
      }
      current = current[key];
    }

    return current as string;
  };

  return { t, locale };
}
