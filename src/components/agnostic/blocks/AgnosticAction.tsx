/**
 * 🏛️ ARTEFACTO: AgnosticAction.tsx
 * ────────────
 * CAPA: Projection (Decentralized Action Buttons)
 * VERSIÓN: 1.0
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
  
  // Resolve Lucide Icon
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
          payload: {
            record: effectiveRecord,
            context,
            schema
          }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Execution failed');
      }

      // Process transaction audit events returned from the server-side engine
      if (Array.isArray(result.events)) {
        for (const event of result.events) {
          if (event.action === 'notify') {
            if (event.type === 'success') {
              toast.success(event.message);
            } else {
              toast.error(event.message);
            }
          } else if (event.action === 'materia_sync') {
            // Keep frontend in perfect sync with backend changes!
            updateItem(event.context, event.item);
          } else if (event.action === 'print_pdf') {
            const htmlContent = event.payload?.html || '';
            // Hidden iframe avoids popup blocker — works from async context
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
            document.body.appendChild(iframe);
            iframe.contentDocument!.open();
            iframe.contentDocument!.write(htmlContent);
            iframe.contentDocument!.close();
            iframe.contentWindow!.focus();
            setTimeout(() => {
              iframe.contentWindow!.print();
              setTimeout(() => document.body.removeChild(iframe), 2000);
            }, 500);
          }
        }
      }

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
