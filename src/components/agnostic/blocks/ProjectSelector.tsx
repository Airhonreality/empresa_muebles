'use client';

/**
 * 🏛️ ARTEFACTO: ProjectSelector.tsx
 * ────────────
 * CAPA: Projection (Navigation Block)
 * VERSIÓN: 8.0
 * COMMIT: P3-M4.4-ATOMIC-SELECTOR
 * ADR: [adr_v8_0_deterministic_state.md]
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Navegación global y búsqueda de entidades raíz (Proyectos).
 * - Resolución de identidad activa para el Navigator.
 * - Soporte para creación rápida de materia (DNA-Ready).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Consumir la materia directamente desde useMateriaStore.
 * - NEVER: Gestionar persistencia interna (Delegar a Agnostic API).
 * - NEVER: Almacenar lógica de enrutamiento compleja.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [useMateriaStore, Next.js Router]
 * - DOWNSTREAM: [MasterRoute]
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMateriaStore } from '@/lib/agnostic/store';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Plus, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectSelector() {
  const { data: materiaStore } = useMateriaStore();
  const router = useRouter();
  const { slug } = useParams();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const projects = materiaStore['projects'] || [];
  
  // Find current project to set initial placeholder
  const activeSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
  const currentProject = projects.find((p: any) => p.data._slug === activeSlug);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = projects.filter((p: any) => 
    p.data.name?.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = filtered.find((p: any) => p.data.name?.toLowerCase() === search.toLowerCase());
  const showCreate = search.length > 0 && !exactMatch;

  const handleSelect = (projectSlug: string) => {
    setIsOpen(false);
    setSearch('');
    router.push(`/project/${projectSlug}`);
  };

  const handleCreate = () => {
    setIsOpen(false);
    setSearch('');
    // We navigate to create-project, but we don't auto-create it yet.
    // The user will see the form to fill it out completely.
    // Ideally, we could pass ?name=search, but the form isn't reading URL params yet.
    router.push('/create-project'); 
  };

  return (
    <div className="relative w-full max-w-sm mb-6 z-50" ref={containerRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within:opacity-100 group-focus-within:text-primary transition-all" />
        <Input
          type="text"
          placeholder={currentProject ? `Proyecto actual: ${currentProject.data.name}` : "Buscar o crear proyecto..."}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 bg-card/40 backdrop-blur-xl border-border/30 h-10 font-bold text-xs shadow-sm focus:ring-0 focus:border-primary/40"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-card/95 backdrop-blur-2xl border border-border/30 rounded-lg shadow-xl overflow-hidden luxe-shadow animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && !showCreate ? (
              <div className="p-4 text-center text-xs font-bold opacity-30">
                No hay proyectos. Escribe para crear uno.
              </div>
            ) : (
              filtered.map((p: any) => (
                <button
                  key={p.id || p.data?._slug || Math.random()}
                  onClick={() => handleSelect(p.data._slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md hover:bg-primary/10 transition-colors group"
                >
                  <FolderKanban className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black truncate">{p.data.name}</span>
                    {p.data.client_name && (
                      <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{p.data.client_name}</span>
                    )}
                  </div>
                </button>
              ))
            )}

            {showCreate && (
              <button
                onClick={handleCreate}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md hover:bg-primary border-t border-border/10 transition-colors group mt-1"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-background/20 transition-colors">
                  <Plus className="w-3 h-3 group-hover:text-background" />
                </div>
                <span className="text-xs font-black group-hover:text-background">
                  Crear proyecto "{search}"
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
