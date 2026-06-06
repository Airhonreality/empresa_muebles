'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Database, Palette, RefreshCw } from 'lucide-react';
import { AgnosticConfigProjector } from '@/components/agnostic/modules/AgnosticConfigProjector';
import tokensSchema from '@/core/designer/dna/tokens.schema.json';

interface SystemSectionProps {
  config: Record<string, unknown>;
  setConfig: (newConfig: any) => Promise<void> | void;
}

export function SystemSection({ config, setConfig }: SystemSectionProps) {
  const [localTokens, setLocalTokens] = useState<any>(config);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalTokens(config);
  }, [config]);

  const isDirty = JSON.stringify(localTokens?.ui_tokens) !== JSON.stringify(config?.ui_tokens);

  const handleSaveTokens = async () => {
    setIsSaving(true);
    try {
      await setConfig(localTokens);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-2 animate-in fade-in duration-500">

      {/* Estrategia activa — read-only */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
          <Shield size={14} className="text-primary" /> Soberanía y Núcleo
        </h3>
        <div className="bg-background border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estrategia del Adaptador</Label>
            <div className="h-9 px-3 border bg-muted/20 rounded-xl flex items-center text-xs font-bold text-foreground">
              <span className="flex items-center gap-2 text-primary">
                <Database size={13} />
                {process.env.GITHUB_REPO ? 'GitHub Strategy' : process.env.SUPABASE_URL ? 'Supabase Strategy' : 'Local (Archivos JSON)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FR3 — Tokens con estado local + save explícito */}
      <div className="space-y-3 border-t pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
            <Palette size={14} className="text-primary" /> Tokens Estéticos
          </h3>
          {isDirty && (
            <Button
              size="sm"
              onClick={handleSaveTokens}
              disabled={isSaving}
              className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3"
            >
              <RefreshCw size={10} className={isSaving ? 'animate-spin' : ''} />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
        <div className="bg-background border rounded-2xl p-4 shadow-sm">
          <AgnosticConfigProjector
            schema={tokensSchema}
            data={localTokens}
            onUpdate={(patch) => setLocalTokens((prev: any) => ({
              ...prev,
              ...(patch.ui_tokens ? { ui_tokens: { ...(prev?.ui_tokens || {}), ...patch.ui_tokens } } : patch),
            }))}
          />
        </div>
      </div>


    </div>
  );
}
