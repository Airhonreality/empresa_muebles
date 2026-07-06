'use client';

import React, { useMemo, useState } from 'react';
import type { IntegrationConfigPanelProps } from '@agnostic/core';

const FIELD_KEYS = [
  'TIKTOK_CLIENT_ID',
  'TIKTOK_CLIENT_SECRET',
  'TIKTOK_ACCESS_TOKEN',
  'TIKTOK_REFRESH_TOKEN',
  'TIKTOK_REFRESH_TOKEN_EXPIRES_AT',
] as const;

export function ConfigPanel({ envPresence, onSave }: IntegrationConfigPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const allFilled = useMemo(() => FIELD_KEYS.slice(0, 4).every(key => values[key]?.trim()), [values]);

  const handleSave = async () => {
    if (!allFilled) return;
    setSaving(true);
    try {
      await onSave(Object.fromEntries(FIELD_KEYS.map(key => [key, values[key]?.trim() ?? ''])));
      setValues({});
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">TikTok Business Messaging</h3>
        <p className="text-xs text-muted-foreground">
          Configura las credenciales de OAuth y el vencimiento opcional del refresh token para modelar `requiere_reauth`.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELD_KEYS.map(key => {
          const present = envPresence[key];
          return (
            <label key={key} className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold">{key}</span>
                <span className={present ? 'text-emerald-600' : 'text-muted-foreground'}>
                  {present ? 'configured' : 'missing'}
                </span>
              </div>
              <input
                type={key === 'TIKTOK_REFRESH_TOKEN_EXPIRES_AT' ? 'text' : 'password'}
                value={values[key] ?? ''}
                onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none"
                placeholder={present ? 'replace value' : 'enter value'}
                autoComplete="off"
              />
            </label>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!allFilled || saving}
        className="rounded-md border border-border px-3 py-2 text-xs font-semibold disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save configuration'}
      </button>
    </div>
  );
}
