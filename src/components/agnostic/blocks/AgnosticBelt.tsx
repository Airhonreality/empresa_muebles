/**
 * 🛡️ AGNOSTIC BELT v6.0 (Shadcn-Native Control)
 * ===========================================
 */
'use client';

import React from 'react';
import { useAppState } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, ChevronRight, Layers, Share2, Printer } from 'lucide-react';

interface Props {
  moduleName?: string;
  config?: any;
  configSchema?: any;
  onOpenConfig?: () => void;
  className?: string;
}

export function AgnosticBelt({ moduleName, config, configSchema, onOpenConfig, className }: Props) {
  const { state } = useAppState();
  const { user } = useAuth();

  // Resolve Context Path for Breadcrumb
  const path = state.system.currentPath || '';
  const segments = path.split('/').filter(Boolean);

  return (
    <TooltipProvider>
      <Card className={cn(
        "h-16 flex items-center px-6 border-border luxe-shadow bg-card/80 backdrop-blur-md sticky top-6 z-40 transition-all duration-500 animate-in slide-in-from-top-4",
        className
      )}>
        <CardContent className="p-0 flex items-center justify-between w-full h-full">
          
          {/* 📍 SOVEREIGN BREADCRUMB */}
          <div className="flex items-center gap-4 h-full">
            <div className="bg-primary/5 p-2 rounded-lg">
              <Layers className="w-4 h-4 text-primary opacity-60" />
            </div>
            <Separator orientation="vertical" className="h-4" />
            <nav className="flex items-center text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
              <span className="hover:opacity-100 cursor-pointer transition-opacity">Indra</span>
              {segments.map((s, i) => (
                <React.Fragment key={s}>
                  <ChevronRight className="w-3 h-3 mx-1.5 opacity-30" />
                  <span className={cn(
                    "hover:opacity-100 cursor-pointer transition-opacity",
                    i === segments.length - 1 ? "opacity-100 text-primary" : ""
                  )}>
                    {s.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* 🛠️ ACTION ARRAY */}
          <div className="flex items-center gap-4">
            <div className="hidden @md:flex items-center gap-1 mr-2">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors opacity-30 hover:opacity-100">
                <Share2 size={14} />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors opacity-30 hover:opacity-100">
                <Printer size={14} />
              </button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* ⚙️ SOVEREIGN CALIBRATION GEAR */}
            {configSchema && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onOpenConfig}
                    className="flex items-center gap-3 px-5 py-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all luxe-shadow group"
                  >
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest hidden @sm:block">Calibrar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-bold p-3">
                  Configurar parámetros de {moduleName || 'Lógica'}
                </TooltipContent>
              </Tooltip>
            )}

            {!configSchema && (
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.2em] opacity-20 border-dashed py-1 px-2.5">
                Materia_Estática
              </Badge>
            )}
          </div>

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
