'use client';

/**
 * ⚙️ SYSTEM SECTION (Core Identity)
 * ───────────────
 * CAPA: Sovereignty Layer (Configuration)
 */

import { 
  Rocket, 
  Shield, 
  Globe, 
  Fingerprint,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// DNA Import (Registry)
import languageRegistry from '@/core/designer/dna/language_registry.json';

interface SystemSectionProps {
  config: Record<string, string>;
  setConfig: (config: any) => void;
}

export function SystemSection({ config: localConfig, setConfig: setLocalConfig }: SystemSectionProps) {
  const handleUpdate = (key: string, value: string) => {
    setLocalConfig({ ...localConfig, [key]: value });
  };

  return (
    <div className="space-y-12 pb-10">
      
      {/* 🚀 IDENTITY */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 text-primary">
           <Rocket size={18} className="opacity-70" />
           <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Satellite Identity</h3>
        </div>
        
        <div className="grid grid-cols-1 @[600px]:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">App Public Name</label>
            <Input 
              value={localConfig.app_name || ''} 
              onChange={(e) => handleUpdate('app_name', e.target.value)}
              placeholder="Ej: Indra Agnostic System"
              className="h-14 rounded-3xl bg-muted/5 border-border/5 px-6 text-lg font-black tracking-tight focus-visible:ring-primary/20"
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">System Unique Slug</label>
            <Input 
              value={localConfig.app_slug || ''} 
              onChange={(e) => handleUpdate('app_slug', e.target.value)}
              placeholder="ind-system-core"
              className="h-14 rounded-3xl bg-muted/5 border-border/5 px-6 font-mono text-[12px] opacity-70 focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </section>

      <Separator className="opacity-5" />

      {/* 🌍 LOCALIZATION */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 text-primary">
           <Globe size={18} className="opacity-70" />
           <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Localization DNA</h3>
        </div>
        
        <div className="grid grid-cols-1 @[600px]:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">Primary Currency</label>
            <Select 
              value={localConfig.currency || 'USD'} 
              onValueChange={(val) => handleUpdate('currency', val)}
            >
              <SelectTrigger className="h-14 rounded-3xl bg-muted/5 border-border/5 px-6 font-bold focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/10">
                {languageRegistry.currencies.map(curr => (
                  <SelectItem key={curr.id} value={curr.id} className="rounded-xl my-1">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-primary font-black">{curr.symbol}</span>
                      <span>{curr.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] ml-1">System Locale (ISO)</label>
            <Select 
              value={localConfig.locale || 'en-US'} 
              onValueChange={(val) => handleUpdate('locale', val)}
            >
              <SelectTrigger className="h-14 rounded-3xl bg-muted/5 border-border/5 px-6 font-bold focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/10">
                {languageRegistry.locales.map(loc => (
                  <SelectItem key={loc.id} value={loc.id} className="rounded-xl my-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{loc.flag}</span>
                      <span className="font-bold">{loc.name}</span>
                      <span className="text-[9px] opacity-40 font-mono ml-auto">[{loc.id}]</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator className="opacity-5" />

      {/* 🛡️ SECURITY */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 text-primary">
           <Shield size={18} className="opacity-70" />
           <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Security Shell</h3>
        </div>
        
        <Card className="bg-primary/[0.02] border-primary/5 rounded-[3rem] overflow-hidden shadow-none">
          <CardContent className="p-10 flex items-center justify-between gap-6">
             <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Fingerprint size={18} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Auth Rejection Protocol</p>
                </div>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-sm font-medium">
                  El sistema redirige automáticamente a la pantalla de identidad en caso de fallo de autenticación o caducidad de sesión.
                </p>
             </div>
             <div className="flex flex-col items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/20" />
                <span className="text-[9px] font-black text-emerald-500 tracking-tighter">ACTIVE</span>
             </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="opacity-5" />

      {/* 📡 INFRASTRUCTURE PULSE */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 text-primary">
           <Zap size={18} className="opacity-70" />
           <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Infrastructure Pulse</h3>
        </div>

        <div className="grid grid-cols-1 @[600px]:grid-cols-2 gap-6">
          <Card className="bg-muted/5 border-border/5 rounded-[2.5rem] shadow-none hover:border-primary/10 transition-all duration-300">
            <CardContent className="p-8 flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border border-border/5">
                <Globe size={22} className="text-primary opacity-40" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">GitHub DNA Sync</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-500 tracking-tighter uppercase">Synced</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/40 font-mono tracking-tighter">Repo: agnostic-system-dna</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/5 border-border/5 rounded-[2.5rem] shadow-none hover:border-primary/10 transition-all duration-300">
            <CardContent className="p-8 flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border border-border/5">
                <Fingerprint size={22} className="text-primary opacity-40" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Data Persistence</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-500 tracking-tighter uppercase">Online</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/40 font-mono tracking-tighter">Provider: Supabase (Postgres)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
