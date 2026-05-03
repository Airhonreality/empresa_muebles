'use client';

import { useState } from 'react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { DataItem } from '@/core/types';
import { 
  Globe, Save, Shield, Fingerprint, Coins, 
  Settings, PenTool, Braces, Rocket, Box
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AgnosticInput } from '@/components/agnostic/AgnosticInput';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Props {
  t: (key: string) => string;
}

export function SystemConfigPanel({ t }: Props) {
  const { state } = useAppState();
  const { saveItem } = useAppDispatch();
  
  // Flatten config for easier editing
  const configItems = state.data['system_config'] ?? [];
  const [localConfig, setLocalConfig] = useState<Record<string, string>>(() => {
    return configItems.reduce((acc, item) => ({ ...acc, ...(item.data as Record<string, string>) }), {});
  });

  const handleUpdate = (key: string, value: string) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await saveItem('system_config', {
        id: 'main_config',
        context: 'system_config',
        data: localConfig,
      });
      toast.success('System configuration crystalized.');
    } catch (e) {
      toast.error('Failed to sync system config.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Globe className="text-primary" size={24} />
            {t('system.config')}
          </h2>
          <p className="text-muted-foreground text-xs font-medium opacity-50 italic">Global Identity & Axioms</p>
        </div>
        <Button onClick={handleSave} size="sm" className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
          <Save size={16} className="mr-2" />
          {t('common.save')}
        </Button>
      </div>

      <Separator className="bg-border/20" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* App Identity Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary/60">
             <Rocket size={14} />
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Identity</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground/60 ml-1">APP_NAME</label>
              <AgnosticInput 
                value={localConfig.app_name || ''} 
                onSync={(val) => handleUpdate('app_name', val)}
                placeholder="Satellite Name..."
                className="h-12 bg-muted/20 border-border/10 rounded-2xl px-4 font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground/60 ml-1">SYSTEM_SLUG</label>
              <AgnosticInput 
                value={localConfig.app_slug || ''} 
                onSync={(val) => handleUpdate('app_slug', val)}
                placeholder="Unique Identifier..."
                className="h-10 bg-muted/10 border-border/10 rounded-xl px-4 font-mono text-xs opacity-60"
              />
            </div>
          </div>
        </section>

        {/* Localization & Symbols */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary/60">
             <Coins size={14} />
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Localization</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground/60 ml-1">CURRENCY</label>
              <AgnosticInput 
                value={localConfig.currency || 'USD'} 
                onSync={(val) => handleUpdate('currency', val)}
                className="h-10 bg-muted/20 border-border/10 rounded-xl px-4 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground/60 ml-1">LOCALE</label>
              <AgnosticInput 
                value={localConfig.locale || 'en-US'} 
                onSync={(val) => handleUpdate('locale', val)}
                className="h-10 bg-muted/20 border-border/10 rounded-xl px-4 font-bold"
              />
            </div>
          </div>
        </section>

        {/* Security & Access */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary/60">
             <Shield size={14} />
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Security Shell</h3>
          </div>
          <Card className="bg-primary/5 border-primary/10 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold uppercase text-primary/60">Auth Rejection</p>
                  <p className="text-[9px] text-muted-foreground italic">System re-routes to /login on identity failure.</p>
               </div>
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-sm shadow-primary" />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
