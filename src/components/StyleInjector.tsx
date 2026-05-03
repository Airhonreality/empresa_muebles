'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

export function StyleInjector() {
  const { state } = useAppContext();

  // Apply theme from system_config
  useEffect(() => {
    const theme = state.system.config.theme_mode;
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
    const accent = state.system.config.identity_color;
    if (accent) {
      document.documentElement.style.setProperty('--accent', accent);
    }
  }, [state.system.config]);

  // Inject custom theme CSS from data-silo/styles/theme.css
  useEffect(() => {
    let styleEl: HTMLStyleElement | null = null;

    async function loadTheme() {
      const res = await fetch('/api/silo-styles');
      if (res.status === 204) return;
      const css = await res.text();
      if (!css.trim()) return;

      styleEl = document.createElement('style');
      styleEl.setAttribute('data-silo-theme', 'true');
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    loadTheme().catch(() => null);

    return () => {
      styleEl?.remove();
    };
  }, []);

  return null;
}
