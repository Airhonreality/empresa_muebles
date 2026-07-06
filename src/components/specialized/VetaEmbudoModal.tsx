'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VetaEmbudoForm } from './VetaEmbudoForm';

export function VetaEmbudoModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="veta-surface-glass max-h-[90vh] max-w-4xl overflow-y-auto p-0">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="veta-surface-stone border-b p-8 lg:border-b-0 lg:border-r">
            <DialogHeader className="text-left">
              <DialogTitle className="veta-heading text-3xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))]">
                Agenda una visita sin ruido
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-md text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
                Filtramos el proyecto en dos pasos, guardamos tus datos y abrimos WhatsApp con el mensaje listo para continuar.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8 space-y-4 text-sm text-[hsl(var(--veta-text-stone))]">
              <p>• Captura de GCLID y UTMs en segundo plano.</p>
              <p>• Registro en el CRM local antes de abrir WhatsApp.</p>
              <p>• Enfoque en Bogotá y sectores de investigación confirmados.</p>
            </div>
          </div>
          <div className="p-8">
            <VetaEmbudoForm mode="modal" onSuccess={() => onOpenChange(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
