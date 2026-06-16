'use client';

import React, { useState } from 'react';
import type { IntegrationConfigPanelProps } from '@agnostic/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function ConfigPanel({ envPresence, onSave }: IntegrationConfigPanelProps) {
    const [token, setToken] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleTest = async () => {
        if (!token) return;
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/admin/integrations/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integrationId: 'notion', credentials: { NOTION_TOKEN: token } }),
            });
            setTestResult(await res.json());
        } catch {
            setTestResult({ ok: false, message: 'Error de red' });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!token || !testResult?.ok) return;
        setSaving(true);
        await onSave({ NOTION_TOKEN: token });
        setSaving(false);
        setToken('');
    };

    const hasToken = envPresence['NOTION_TOKEN'];

    return (
        <div className="space-y-4 max-w-lg">
            {hasToken && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <CheckCircle size={14} /> Token configurado
                </div>
            )}
            <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    NOTION_TOKEN {hasToken ? '(reemplazar)' : ''}
                </label>
                <Input
                    type="password"
                    value={token}
                    onChange={e => { setToken(e.target.value); setTestResult(null); }}
                    placeholder="secret_..."
                    className="font-mono text-xs h-9"
                />
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTest}
                    disabled={!token || testing}
                    className="text-[10px] font-black uppercase tracking-widest h-9"
                >
                    {testing ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                    Probar Conexión
                </Button>
                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!testResult?.ok || saving}
                    className="text-[10px] font-black uppercase tracking-widest h-9"
                >
                    {saving ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                    Guardar y Redesplegar
                </Button>
            </div>
            {testResult && (
                <div className={`flex items-center gap-2 text-xs font-semibold ${testResult.ok ? 'text-emerald-600' : 'text-destructive'}`}>
                    {testResult.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                    {testResult.ok ? 'Conexión verificada' : testResult.message}
                </div>
            )}
        </div>
    );
}
