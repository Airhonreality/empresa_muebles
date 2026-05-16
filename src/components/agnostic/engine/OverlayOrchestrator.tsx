/**
 * 🎭 OVERLAY_ORCHESTRATOR: UI PROJECTION LAYER (v2.0 — CVA + STRICT TYPES)
 * =========================================================================
 *
 * ROLE: Projects OverlayConfig intents into Radix UI surfaces.
 *       Radix Dialog/Sheet already portal to document.body via their own
 *       Portal primitive — no additional wrapping needed.
 *
 * CVA VARIANTS:
 *   dialogContentVariants — controls max-width / border-radius per overlay type.
 *   overlayActionsVariants — controls action-row alignment.
 */
'use client';

import React                     from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn }                    from '@/lib/utils';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { AgnosticModuleLoader }  from './AgnosticModuleLoader';
import type { AgnosticAPI }      from '@agnostic/core';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }    from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// ─── CVA VARIANTS ────────────────────────────────────────────────────────────

const dialogContentVariants = cva(
  'bg-background border border-border shadow-2xl',
  {
    variants: {
      size: {
        sm: 'sm:max-w-[425px] rounded-xl',
        md: 'sm:max-w-[600px] rounded-xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const sheetContentVariants = cva(
  'bg-background border-l border-border',
  {
    variants: {
      width: {
        default: 'sm:max-w-[540px]',
        wide:    'sm:max-w-[720px]',
      },
    },
    defaultVariants: { width: 'default' },
  },
);

const overlayActionsVariants = cva(
  'flex gap-3 mt-4',
  {
    variants: {
      align: {
        end:    'justify-end',
        center: 'justify-center',
      },
    },
    defaultVariants: { align: 'end' },
  },
);

type DialogContentVariants = VariantProps<typeof dialogContentVariants>;
type SheetContentVariants  = VariantProps<typeof sheetContentVariants>;
type OverlayActionsVariants = VariantProps<typeof overlayActionsVariants>;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

interface Props {
  api: AgnosticAPI;
  dialogSize?: DialogContentVariants['size'];
  sheetWidth?:  SheetContentVariants['width'];
  actionsAlign?: OverlayActionsVariants['align'];
}

export function OverlayOrchestrator({
  api,
  dialogSize   = 'md',
  sheetWidth   = 'default',
  actionsAlign = 'end',
}: Props) {
  const { ui }         = useAppState();
  const { closeOverlay } = useAppDispatch();

  if (!ui.overlay) return null;

  const { type, title, description, component, props, onConfirm } = ui.overlay;
  const moduleApi: AgnosticAPI = { ...api, ...(props as Partial<AgnosticAPI>) };

  if (type === 'SHEET') {
    return (
      <Sheet open onOpenChange={closeOverlay}>
        <SheetContent className={cn(sheetContentVariants({ width: sheetWidth }))}>
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <Separator className="mb-6" />
          <div className="h-full overflow-y-auto pb-20">
            {component && (
              <AgnosticModuleLoader moduleName={component} api={moduleApi}>
                <div id={`overlay-${component}`} />
              </AgnosticModuleLoader>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (type === 'DIALOG') {
    return (
      <Dialog open onOpenChange={closeOverlay}>
        <DialogContent className={cn(dialogContentVariants({ size: dialogSize }))}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <Separator />
          <div className="py-4">
            {component && (
              <AgnosticModuleLoader moduleName={component} api={moduleApi}>
                <div id={`overlay-${component}`} />
              </AgnosticModuleLoader>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (type === 'CONFIRM') {
    return (
      <Dialog open onOpenChange={closeOverlay}>
        <DialogContent className={cn(dialogContentVariants({ size: 'sm' }))}>
          <DialogHeader>
            <DialogTitle className="text-primary">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className={cn(overlayActionsVariants({ align: actionsAlign }))}>
            <Button variant="ghost"       onClick={closeOverlay}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { onConfirm?.(); closeOverlay(); }}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
