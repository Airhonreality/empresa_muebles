'use client';

import { useAppContext } from '@/context/AppContext';
import { es, en, Dictionary } from './dictionaries';

export function useTranslation() {
  const { state } = useAppContext();
  const locale = state.system.config.locale || 'es';

  const dictionary: Dictionary = locale === 'en' ? en : es;

  /**
   * Translate a key using dot notation (e.g., 'common.save')
   */
  const t = (path: string): string => {
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
