'use client';

/**
 * 🏛️ ARTEFACTO: SitemapSection.tsx
 * ────────────
 * CAPA: Staging (Navigation Architecture)
 * VERSIÓN: 2.0
 * COMMIT: P2-M2.7-ADR-SITEMAP-ORCH
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Definición de la topología de rutas del satélite.
 * - Gestión de permisos de acceso (Privado/Público) por ruta.
 * - Orquestación de la navegación contextual hacia el compositor de bloques.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Garantizar que cada ruta tenga un ID único (UUID) para evitar colisiones en el Staging.
 * - NEVER: Permitir rutas vacías o rutas duplicadas en el mismo nivel de jerarquía.
 * - ALWAYS: Proveer un acceso rápido a la edición de contenido (Composer) desde el mapa.
 * 
 * 📜 ADR: [2026-05-11] SITEMAP_ORCHESTRATION
 * - DECISIÓN: Utilizar un grid responsivo con tarjetas de alto impacto para la gestión de rutas.
 * - MOTIVO: Facilitar la visión global del sitemap en sistemas ERP de gran escala.
 * - IMPACTO: Reducción del tiempo de configuración de la arquitectura de información.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [AgnosticConfigManager]
 * - DOWNSTREAM: [ComposerSection, Page Routes Registry]
 */

import { useState } from 'react';
import { Route as RouteIcon, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SitemapSectionProps {
  routes: any[];
  setRoutes: (routes: any[]) => void;
  onEditRoute: (id: string) => void;
}

export function SitemapSection({ routes, setRoutes, onEditRoute }: SitemapSectionProps) {
  const addRoute = () => {
    const newRoute = {
      id: globalThis.crypto.randomUUID(),
      path: '/nueva-ruta',
      blocks: [],
      isPrivate: true
    };
    setRoutes([...routes, newRoute]);
  };

  const updateRoute = (id: string, patch: any) => {
    setRoutes(routes.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const removeRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-10 pb-20">
      
      {/* 🧭 HEADER & TOOLS */}
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <RouteIcon size={14} />
            Sitemap Orchestrator
          </h3>
          <p className="text-[9px] text-muted-foreground font-mono opacity-50 uppercase tracking-widest">
            Arquitectura de navegación del satélite
          </p>
        </div>

        <Button 
          onClick={(e) => { e.stopPropagation(); addRoute(); }}
          variant="outline" 
          size="sm" 
          className="h-11 rounded-2xl border-2 border-dashed border-primary/20 text-[11px] font-black gap-3 px-8 hover:bg-primary/5 transition-all z-10"
        >
          <Plus size={16} /> Nueva Ruta
        </Button>
      </div>

      {/* 🗺️ GRID DE RUTAS */}
      <div className="grid grid-cols-1 @[800px]:grid-cols-2 gap-6">
        {routes.map((route) => (
          <div 
            key={route.id} 
            className="group relative bg-muted/5 border border-border/10 rounded-[2.5rem] p-10 hover:bg-background hover:border-primary/20 transition-all duration-300"
          >
            {/* ACCIONES FLOTANTES (Visibles y con Z-Index) */}
            <div className="absolute right-6 top-6 flex items-center gap-2 z-20">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); removeRoute(route.id); }}
                className="rounded-2xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white h-10 w-10 transition-all"
              >
                <Trash2 size={18} />
              </Button>
            </div>

            <div className="flex items-start gap-5 mb-10 mr-12">
              <div className="p-4 bg-primary/5 rounded-[1.5rem] text-primary/30 group-hover:text-primary transition-colors">
                <RouteIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <Input 
                  value={route.path}
                  onChange={(e) => updateRoute(route.id, { path: e.target.value })}
                  className="bg-transparent border-none shadow-none text-xl font-black tracking-tighter p-0 h-auto focus-visible:ring-0"
                />
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest opacity-40 rounded-full border-muted-foreground/20">
                    {route.blocks?.length || 0} Bloques
                  </Badge>
                  <Badge 
                    onClick={() => updateRoute(route.id, { isPrivate: !route.isPrivate })}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer border-none px-4",
                      route.isPrivate ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                    )}
                  >
                    {route.isPrivate ? "Privado" : "Público"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border/5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest font-mono">
                <span>DNA_HASH:</span>
                <span className="text-primary/40">{route.id.split('-')[0]}</span>
              </div>
              <Button 
                onClick={() => onEditRoute(route.id)}
                variant="ghost" 
                size="sm" 
                className="h-10 text-[11px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all rounded-2xl px-6"
              >
                Editar Bloques
                <Edit2 size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
