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

  const processEvent = React.useCallback(async (event: any) => {
    switch (event.action) {

      case 'notify':
        event.type === 'success'
          ? toast.success(event.message)
          : toast.error(event.message);
        break;

      case 'materia_sync':
        updateItem(event.context, event.item);
        break;

      case 'print_pdf': {
        const html = event.payload?.html || '';
        // Hidden iframe avoids popup blocker — works from async context
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
        await new Promise<void>((resolve) => {
          iframe.onload = async () => {
            // Wait for web fonts before printing — prevents blank-font output with Google Fonts
            await (iframe.contentDocument as any)?.fonts?.ready;
            iframe.contentWindow!.focus();
            iframe.contentWindow!.print();
            setTimeout(() => { document.body.removeChild(iframe); resolve(); }, 500);
          };
          document.body.appendChild(iframe);
          iframe.contentDocument!.open();
          iframe.contentDocument!.write(html);
          iframe.contentDocument!.close();
        });
        break;
      }

      case 'download_pdf': {
        const { template, inputs, filename = 'documento.pdf' } = event.payload || {};
        const res = await fetch('/api/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template, inputs })
        });
        if (!res.ok) { toast.error('Error generando PDF'); break; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        break;
      }

      case 'download_file': {
        const { content, filename = 'archivo.txt', mimeType = 'text/plain' } = event.payload || {};
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        break;
      }

      case 'redirect':
        window.location.href = event.payload?.path || '/';
        break;

      case 'open_url':
        window.open(event.payload?.url, event.payload?.target ?? '_blank');
        break;

      case 'clipboard':
        await navigator.clipboard.writeText(event.payload?.text || '');
        toast.success('Copiado al portapapeles');
        break;
    }
  }, [updateItem]);

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

      for (const event of result.events ?? []) {
        await processEvent(event);
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
