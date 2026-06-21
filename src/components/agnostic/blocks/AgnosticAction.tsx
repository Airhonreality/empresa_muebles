/**
 * 🏛️ ARTEFACTO: AgnosticAction.tsx
 * ────────────
 * CAPA: Projection (Decentralized Action Buttons)
 * VERSIÓN: 2.0
 *
 * 🎯 FUNCTIONAL_SCOPE:
 * - Proyección de gatillos de acción agnósticos (Buttons) vinculados a Zaps (Scripts).
 * - Ejecución determinista libre de hardcode a través del orquestador.
 */
'use client';

import React from 'react';
import { useMateriaStore } from '@/lib/agnostic/store';
import { saveAllForms } from '@/lib/agnostic/formRegistry';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

interface AgnosticActionProps {
  title?: string;
  label?: string;
  zap?: string;
  logic?: {
    zap?: string;
  };
  visual?: {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    theme?: string;
    icon?: string;
    className?: string;
  };
  save_forms_first?: boolean;
  className?: string;
  api?: any;
  record?: any;
  context?: string;
  schema?: any;
}

export function AgnosticAction({
  title,
  label,
  zap: propZap,
  logic,
  visual,
  save_forms_first,
  className,
  api,
  record,
  activeRecord,
  context,
  schema
}: AgnosticActionProps & { activeRecord?: any }) {
  const effectiveRecord = record || activeRecord;
  const [isExecuting, setIsExecuting] = React.useState(false);
  const updateItem = useMateriaStore((state) => state.updateItem);

  const zap = propZap || logic?.zap;
  const buttonLabel = label || title || "Ejecutar Acción";

  const iconName = visual?.icon;
  const IconComponent = iconName && iconName in Icons
    ? (Icons as any)[iconName]
    : null;

  const handleExecute = async () => {
    if (!zap) {
      toast.error("Ningún script de acción (Zap) configurado para este botón");
      return;
    }

    if (isExecuting) return;
    setIsExecuting(true);

    try {
      if (save_forms_first) {
        const toastId = toast.loading("Guardando formularios...");
        await saveAllForms();
        toast.dismiss(toastId);
      }

      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap,
          payload: { record: effectiveRecord, context, schema }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Execution failed');
      }

      const { processEvents } = await import('@/lib/agnostic/eventProcessor');
      await processEvents(result.events ?? [], updateItem);

    } catch (e: any) {
      console.error(`[AgnosticAction] Error executing Server-Side Zap "${zap}":`, e);
      toast.error(`Fallo en Zap: ${e.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={cn("flex justify-end p-2", className)}>
      <Button
        onClick={handleExecute}
        disabled={isExecuting}
        variant={visual?.variant || 'default'}
        size={visual?.size || 'default'}
        className={cn(
          "font-bold uppercase text-xs tracking-wider gap-2 transition-all active:scale-[0.98]",
          visual?.theme && `theme-${visual.theme}`,
          visual?.className
        )}
      >
        {isExecuting ? (
          <>
            <Icons.Sparkles className="w-4 h-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            {IconComponent && <IconComponent className="w-4 h-4" />}
            {buttonLabel}
          </>
        )}
      </Button>
    </div>
  );
}
