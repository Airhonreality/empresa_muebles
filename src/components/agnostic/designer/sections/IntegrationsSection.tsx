'use client';

import React, { useEffect, useState } from 'react';
import type { IntegrationClientModule } from '@agnostic/core';
import agnosticConfig from '@/../agnostic.config';
import { Button } from '@/components/ui/button';
import { Plug2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationsSectionProps {
    envPresence: Record<string, boolean>;
}

export function IntegrationsSection({ envPresence }: IntegrationsSectionProps) {
    const loaders = agnosticConfig.integrations ?? {};
    const ids = Object.keys(loaders);

    const [selected, setSelected] = useState<string | null>(ids[0] ?? null);
    const [modules, setModules] = useState<Record<string, IntegrationClientModule>>({});
    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!selected || modules[selected]) return;
        setLoading(selected);
        loaders[selected]!()
            .then(rawMod => {
                const mod = (rawMod as any).default || rawMod;
                setModules(prev => ({ ...prev, [selected]: mod }));
            })
            .catch(() => toast.error(`Error cargando módulo ${selected}`))
            .finally(() => setLoading(null));
    }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = async (vars: Record<string, string>) => {
        const variables = Object.entries(vars).map(([key, value]) => ({ key, value, sensitive: true }));
        const res = await fetch('/api/admin/config/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables, redeploy: true }),
        });
        if (!res.ok) {
            toast.error('Error guardando variables');
            return;
        }
        toast.success('Variables guardadas. Redeploy iniciado.');
    };

    if (ids.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
                <Plug2 size={32} className="text-muted-foreground/30 animate-pulse" />
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest">Sin integraciones registradas</p>
                    <p className="text-[10px] text-muted-foreground">
                        Añade integraciones en <code className="font-mono bg-muted px-1 rounded">agnostic.config.ts</code> bajo la clave <code className="font-mono bg-muted px-1 rounded">integrations</code>.
                    </p>
                </div>
            </div>
        );
    }

    const activeMod = selected ? modules[selected] : null;
    const Panel = activeMod?.ConfigPanel ?? null;

    return (
        <div className="h-full flex overflow-hidden">
            {/* Sidebar de integraciones */}
            <aside className="w-48 border-r flex flex-col gap-1 p-2 shrink-0 bg-muted/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 py-1">Integraciones</p>
                {ids.map(id => (
                    <button
                        key={id}
                        onClick={() => setSelected(id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${selected === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        {id}
                    </button>
                ))}
            </aside>

            {/* Panel de configuración */}
            <div className="flex-1 overflow-y-auto p-8">
                {loading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 size={14} className="animate-spin" /> Cargando módulo...
                    </div>
                )}
                {activeMod && !loading && (
                    <div className="space-y-4">
                        <div className="space-y-1 border-b pb-4">
                            <h2 className="text-sm font-black uppercase tracking-widest">{activeMod.meta.name}</h2>
                            <p className="text-[10px] text-muted-foreground">{activeMod.meta.description}</p>
                        </div>
                        {Panel && <Panel envPresence={envPresence} onSave={handleSave} />}
                    </div>
                )}
            </div>
        </div>
    );
}
