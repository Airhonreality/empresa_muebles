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
 * - Navegación global y búsqueda de entidades raíz.
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
import { useMateriaStore, useDNAStore } from '@/lib/agnostic/store';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Plus, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/context/AppContext';

interface ProjectSelectorProps {
  context?: string;
  singular?: string;
  className?: string;
  subtitleField?: string;
  titleField?: string;
  title_field?: string;
  subtitle_field?: string;
}

export function ProjectSelector({ 
  context = 'projects', 
  singular, 
  className, 
  subtitleField,
  titleField,
  title_field,
  subtitle_field
}: ProjectSelectorProps) {
  const { data: materiaStore } = useMateriaStore();
  const { schemas } = useDNAStore();
  const { saveItem } = useAppDispatch();
  const router = useRouter();
  const { slug } = useParams();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = materiaStore[context] || [];

  // Resolve schema for active context
  const schema = schemas.find((s: any) => s.id === context || s.data?.name === context)?.data;
  const schemaFields = Array.isArray(schema?.fields) ? (schema.fields as any[]) : [];

  // Resolve conscious route-config decisions or fallback to adaptive primary field inference
  const activeTitleField = titleField || title_field;
  const activeSubtitleField = subtitleField || subtitle_field;

  const inferredTitleField = activeTitleField || (
    schemaFields.find((f: any) => f.isPrimary || f.config?.isPrimary)?.key ||
    schemaFields.find((f: any) => f.type === 'text')?.key ||
    'name'
  );

  // Find current active item to set initial placeholder
  const activeSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
  const currentItem = items.find((p: any) => p.id === activeSlug || p.data?._slug === activeSlug);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = items.filter((p: any) =>
    String(p.data?.[inferredTitleField] || '').toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = filtered.find((p: any) => String(p.data?.[inferredTitleField] || '').toLowerCase() === search.toLowerCase());
  const showCreate = search.length > 0 && !exactMatch;

  const baseSlug = singular ?? context.replace(/s$/, '');
  const singularLabel = singular?.toUpperCase() ?? context.replace(/s$/, '').toUpperCase();

  const handleSelect = (itemId: string) => {
    setIsOpen(false);
    setSearch('');
    router.push(`/${baseSlug}/${itemId}`);
  };

  const handleCreate = async () => {
    setIsOpen(false);
    const newId = self.crypto.randomUUID();
    await saveItem(context, {
      id: newId,
      data: { [inferredTitleField]: search }
    });
    setSearch('');
    router.push(`/${baseSlug}/${newId}`);
  };

  const getSubtitle = (p: any) => {
    if (!activeSubtitleField) return '';
    const subField = schemaFields.find((f: any) => f.key === activeSubtitleField);
    if (subField?.type === 'relation') {
      const relId = p.data?.[subField.key];
      if (relId) {
        const relEntity = subField.config?.relation?.entity;
        const relList = materiaStore[relEntity] || [];
        const relItem = relList.find((r: any) => r.id === relId);
        if (relItem) {
          const relSchema = schemas.find((s: any) => s.id === relEntity || s.data?.name === relEntity)?.data;
          const relFields = Array.isArray(relSchema?.fields) ? (relSchema.fields as any[]) : [];
          const displayKey = subField.config?.relation?.display_field ||
            relFields.find((f: any) => f.isPrimary || f.config?.isPrimary)?.key ||
            'name';
          return relItem.data?.[displayKey] || relItem.id;
        }
      }
    }
    return p.data?.[activeSubtitleField] || '';
  };

  return (
    <div className={cn("relative w-full max-w-sm mb-8 z-50", className)} ref={containerRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
        <Input
          type="text"
          placeholder={currentItem ? `${singularLabel}: ${currentItem.data[inferredTitleField] || 'Sin Nombre'}` : `Buscar o crear ${singularLabel.toLowerCase()}...`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 bg-background border h-10 font-bold text-xs shadow-sm"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-popover border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filtered.length === 0 && !showCreate ? (
              <div className="p-4 text-center text-xs font-bold text-muted-foreground italic">
                No hay {context.toLowerCase()} disponibles.
              </div>
            ) : (
              filtered.map((p: any) => (
                <button
                  key={p.id || p.data?._slug || Math.random()}
                  onClick={() => handleSelect(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="p-1.5 bg-muted rounded-md text-muted-foreground group-hover:text-primary transition-colors">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold truncate">{String(p.data?.[inferredTitleField] || 'Sin Nombre')}</span>
                    {getSubtitle(p) && (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{String(getSubtitle(p))}</span>
                    )}
                  </div>
                </button>
              ))
            )}

            {showCreate && (
              <button
                onClick={handleCreate}
                className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors group mt-1 border-t"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">
                  Crear {singularLabel.toLowerCase()} "{search}"
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
