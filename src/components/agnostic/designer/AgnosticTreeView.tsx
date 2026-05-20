'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * 🏛️ ARTEFACTO: AgnosticTreeView.tsx
 * ────────────
 * CAPA: Designer (Universal Components)
 * VERSIÓN: 1.0
 * COMMIT: P3-M2.1-TREEVIEW-REUSABLE
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Renderizar de forma interactiva y jerárquica las estructuras del sistema (rutas, schemas, scripts).
 * - Proveer navegación limpia y unificada con soporte de expansiones y estados visuales premium.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser un componente puro libre de peticiones de red directas.
 * - NEVER: Duplicar lógica de pintado jerárquico; consumir recursivamente la estructura de nodos.
 * - ALWAYS: Usar tokens estandarizados de diseño de shadcn/ui.
 */

export interface TreeNode {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;           // "3 blocks", "5 fields"
  children?: TreeNode[];
  isExpandable?: boolean;
  data?: any;                        // el record completo para el editor
}

interface AgnosticTreeViewProps {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  onAdd?: () => void;
  addLabel?: string;
  emptyMessage?: string;
}

export function AgnosticTreeView({
  nodes,
  selectedId,
  onSelect,
  onAdd,
  addLabel = 'Agregar',
  emptyMessage = 'No hay elementos disponibles.'
}: AgnosticTreeViewProps) {
  return (
    <div className="flex flex-col h-full space-y-4">
      {onAdd && (
        <Button 
          onClick={onAdd} 
          variant="outline" 
          size="sm" 
          className="w-full gap-2 border-dashed border-primary/20 hover:border-primary/50 text-xs font-black tracking-widest uppercase py-4"
        >
          <Plus size={14} />
          {addLabel}
        </Button>
      )}

      {nodes.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-1">
          {nodes.map(node => (
            <TreeItem 
              key={node.id} 
              node={node} 
              selectedId={selectedId} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeItem({ 
  node, 
  selectedId, 
  onSelect 
}: { 
  node: TreeNode; 
  selectedId: string | null; 
  onSelect: (node: TreeNode) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpandable = node.isExpandable || hasChildren;
  const Icon = node.icon;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="select-none space-y-1">
      <div 
        className={cn(
          "flex items-center w-full px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors group",
          isSelected 
            ? "bg-accent text-accent-foreground font-bold" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        onClick={handleSelect}
      >
        {/* Toggle Chevron */}
        {isExpandable ? (
          <div 
            onClick={handleToggle}
            className="p-1 rounded hover:bg-accent/50 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mr-1"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        ) : (
          <div className="w-6 shrink-0" />
        )}

        {/* Node Icon */}
        {Icon && (
          <Icon 
            size={14} 
            className={cn(
              "mr-2 shrink-0", 
              isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} 
          />
        )}

        {/* Label */}
        <span className="flex-1 truncate">{node.label}</span>

        {/* Hover Link Button for Routes only */}
        {node.data?.data?.path && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(node.data.data.path, '_blank');
            }}
            className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-primary/10 ml-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
            title="Abrir Ruta en pestaña nueva"
          >
            <ExternalLink size={11} />
          </div>
        )}

        {/* Badge */}
        {node.badge !== undefined && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-muted/40 ml-2 group-hover:bg-muted/80">
            {node.badge}
          </span>
        )}
      </div>

      {/* Children Nodes */}
      {isExpandable && isOpen && hasChildren && (
        <div className="pl-4 border-l border-border ml-3.5 mt-1 space-y-1">
          {node.children!.map(child => (
            <TreeItem 
              key={child.id} 
              node={child} 
              selectedId={selectedId} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
