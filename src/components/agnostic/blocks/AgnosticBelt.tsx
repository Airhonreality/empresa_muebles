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
        "h-16 flex items-center px-6 border bg-background shadow-sm sticky top-6 z-40 transition-all duration-300 animate-in slide-in-from-top-4",
        className
      )}>
        <CardContent className="p-0 flex items-center justify-between w-full h-full">
          
          {/* 📍 SOVEREIGN BREADCRUMB */}
          <div className="flex items-center gap-4 h-full">
            <div className="bg-muted p-2 rounded-lg text-primary">
              <Layers className="w-4 h-4" />
            </div>
            <Separator orientation="vertical" className="h-4" />
            <nav className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">Indra</span>
              {segments.map((s, i) => (
                <React.Fragment key={s}>
                  <ChevronRight className="w-3 h-3 mx-2 opacity-50" />
                  <span className={cn(
                    "hover:text-foreground cursor-pointer transition-colors",
                    i === segments.length - 1 ? "text-primary" : ""
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
              <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <Share2 size={16} />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <Printer size={16} />
              </button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* ⚙️ SOVEREIGN CALIBRATION GEAR */}
            {configSchema && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onOpenConfig}
                    className="flex items-center gap-3 px-6 h-10 font-bold uppercase text-[10px] tracking-wider transition-all group"
                  >
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="hidden @sm:block">Calibrar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-bold p-3">
                  Configurar parámetros de {moduleName || 'Lógica'}
                </TooltipContent>
              </Tooltip>
            )}

            {!configSchema && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-dashed py-1 px-3">
                Materia_Estática
              </Badge>
            )}
          </div>

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
