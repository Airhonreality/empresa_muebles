'use client';

/**
 * 🏛️ ARTEFACTO: SitemapSection.tsx
 * ────────────
 * CAPA: Staging (Navigation Architecture)
 * VERSIÓN: 3.1
 * COMMIT: P3-M4.4-FIX-DUPLICATE-IMPORTS
 */

import { useState } from 'react';
import { Route as RouteIcon, Plus, Trash2, Edit2, Layout, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgnosticForm } from '@/components/agnostic/blocks/AgnosticForm';
import { useAgnosticSchema } from '@/lib/agnostic/SchemaInterpreter';

// Schema interno para la gestión de una Ruta
const routeItemSchema = {
  name: 'Page Route',
  fields: [
    { key: "path", label: "URL Path", width: "full", required: true },
    { key: "title", label: "Page Title", width: "full", required: true },
    { 
      key: "isPrivate", 
      label: "Access Policy", 
      width: "half", 
      type: "select", 
      options: [
        { label: "Public (Global)", value: false },
        { label: "Private (Auth Required)", value: true }
      ]
    },
    { 
      key: "layout_mode", 
      label: "Default Layout", 
      width: "half", 
      type: "select", 
      options: [
        { label: "Full Canvas", value: "canvas" },
        { label: "Container Optimized", value: "container" }
      ]
    }
  ]
};

interface SitemapSectionProps {
  routes: any[];
  setRoutes: (routes: any[]) => void;
  onEditRoute: (id: string) => void;
}

export function SitemapSection({ routes, setRoutes, onEditRoute }: SitemapSectionProps) {
  const { schema: resolvedSchema, isLoading } = useAgnosticSchema(routeItemSchema);

  const addRoute = () => {
    const newRoute = {
      id: globalThis.crypto.randomUUID(),
      context: 'page_routes',
      data: {
        path: '/new-route',
        blocks: [],
        isPrivate: true,
        title: 'New Page'
      }
    };
    setRoutes([...routes, newRoute]);
  };

  const updateRoute = (id: string, patch: any) => {
    setRoutes(routes.map(r => {
      if (r.id === id) {
        return { ...r, data: { ...(r.data || {}), ...patch } };
      }
      return r;
    }));
  };

  const removeRoute = (id: string) => {
    if (confirm('¿Eliminar esta ruta permanentemente?')) {
      setRoutes(routes.filter(r => r.id !== id));
    }
  };

  if (isLoading) return <div className="p-12 text-center opacity-30 uppercase text-[10px] font-bold">Mapeando Topología...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Header Centralizado */}
      <div className="flex items-center justify-between border-b pb-6 px-2">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
            <RouteIcon size={16} /> Sitemap Orchestrator
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60 font-bold">
            Navigation topology and access governance
          </p>
        </div>

        <Button 
          onClick={addRoute}
          variant="outline" 
          size="sm" 
          className="font-bold gap-2 px-6 h-10 text-[10px] uppercase tracking-widest"
        >
          <Plus size={16} /> Register New Route
        </Button>
      </div>

      {/* Grid de Rutas Agnósticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes.map((route) => (
          <div 
            key={route.id} 
            className="group relative bg-background border rounded-2xl p-6 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors border border-primary/10">
                <RouteIcon size={20} />
              </div>
              <div className="flex-1">
                <AgnosticForm 
                  schema={resolvedSchema}
                  activeRecord={{ data: route.data || route }}
                  hideHeader={true}
                  onFieldChange={(_, __, allData) => updateRoute(route.id, allData)}
                  className="border-none shadow-none bg-transparent p-0"
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeRoute(route.id)}
                className="text-destructive/30 hover:text-destructive hover:bg-destructive/5 transition-all"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="pt-4 border-t flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[9px] font-bold text-primary/60">
                   <Layout size={10} />
                   <span>{(route.data?.blocks || []).length} Blocks</span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-tighter opacity-40">Route Valid</span>
                </div>
              </div>
              
              <Button 
                onClick={() => onEditRoute(route.id)}
                variant="ghost" 
                size="sm" 
                className="h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 bg-primary/5 text-primary hover:bg-primary/10"
              >
                Edit Content Blocks
                <Edit2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
