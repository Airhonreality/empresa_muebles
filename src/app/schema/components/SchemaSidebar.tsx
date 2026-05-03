'use client';

import { 
  Database, Layout, Settings, FileCode, 
  Terminal, Layers, Cpu, ShieldCheck 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/context/AppContext';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  t: (key: string) => string;
}

export function SchemaSidebar({ activeTab, setActiveTab, t }: Props) {
  const { state } = useAppState();
  
  const menuItems = [
    { id: 'definitions', icon: Database, label: t('schema.definitions'), count: state.data['schema_definitions']?.length },
    { id: 'routes', icon: Layout, label: t('routes.title'), count: state.data['page_routes']?.length },
    { id: 'config', icon: Settings, label: t('system.config'), count: 1 },
  ];

  return (
    <div className="w-64 h-full flex flex-col border-r border-border/10 bg-muted/5 backdrop-blur-xl animate-in slide-in-from-left duration-700">
      <div className="p-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
            <Cpu className="text-primary-foreground" size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tighter">FORJA v2.2</h1>
        </div>
        <div className="flex items-center gap-2 pl-1">
          <ShieldCheck size={10} className="text-primary animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">Sovereign Seed</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <div className="px-4 py-2">
           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Architecture</p>
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
              activeTab === item.id 
                ? "bg-primary text-primary-foreground shadow-xl shadow-primary/10" 
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className={cn("transition-transform", activeTab === item.id ? "scale-110" : "group-hover:scale-110")} />
              <span className="text-xs font-bold tracking-tight">{item.label}</span>
            </div>
            {item.count !== undefined && (
              <span className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded-lg border",
                activeTab === item.id ? "border-primary-foreground/30 text-primary-foreground" : "border-border/10 text-muted-foreground/50"
              )}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="p-5 bg-background/40 border border-border/10 rounded-3xl space-y-4">
           <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/80">Active Storage</p>
           </div>
           <div>
              <p className="text-[10px] font-mono font-bold truncate opacity-60">/storage/default</p>
              <p className="text-[8px] text-muted-foreground italic mt-1">Atomic Collection Engine Active.</p>
           </div>
           <div className="pt-2">
              <div className="w-full bg-muted/20 h-1 rounded-full overflow-hidden">
                 <div className="bg-primary h-full w-2/3 animate-pulse" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
