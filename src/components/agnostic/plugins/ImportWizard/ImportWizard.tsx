'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAppDispatch } from '@/context/AppContext';
import { useMateriaStore } from '@/lib/agnostic/store';
import { ImportSession, SCHEMA_NAMESPACE } from './types';
import { SourceStage } from './stages/SourceStage';
import { MappingStage } from './stages/MappingStage';
import { TargetStage } from './stages/TargetStage';
import { ReviewStage } from './stages/ReviewStage';
import { ExecuteStage } from './stages/ExecuteStage';
import { Database, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Stage = 'source' | 'target' | 'mapping' | 'review' | 'execute';

const STAGES: { key: Stage; label: string }[] = [
  { key: 'source', label: 'Origen' },
  { key: 'target', label: 'Destino' },
  { key: 'mapping', label: 'Mapeo' },
  { key: 'review', label: 'Revisión' },
  { key: 'execute', label: 'Ejecutar' }
];

const STAGE_ORDER = STAGES.map(s => s.key);

interface ImportWizardProps {
  open: boolean;
  onClose: () => void;
  mode?: 'dialog' | 'panel';
}

export function ImportWizard({ open, onClose, mode = 'dialog' }: ImportWizardProps) {
  const [stage, setStage] = useState<Stage>('source');
  const [session, setSession] = useState<ImportSession>({
    source: null,
    mappings: [],
    target: { mode: 'schema_and_records' }
  });

  const { saveItem } = useAppDispatch();
  const { data: materia } = useMateriaStore();
  const schemas = materia[SCHEMA_NAMESPACE] ?? [];

  const handleNext = (patch: Partial<ImportSession>) => {
    const updated = { ...session, ...patch };
    setSession(updated);
    
    const currentIndex = STAGE_ORDER.indexOf(stage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      setStage(STAGE_ORDER[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STAGE_ORDER.indexOf(stage);
    if (currentIndex > 0) {
      setStage(STAGE_ORDER[currentIndex - 1]);
    }
  };

  const handleReset = () => {
    setStage('source');
    setSession({
      source: null,
      mappings: [],
      target: { mode: 'schema_and_records' }
    });
  };

  const content = (
    <>
      {/* Wizard Header and Track Map */}
      <ImportWizardHeader stage={stage} />
      
      {/* Active Stage Viewport */}
      <div className="flex-1 overflow-y-auto p-8 bg-muted/5">
        {stage === 'source' && (
          <SourceStage session={session} onNext={handleNext} />
        )}
        {stage === 'mapping' && (
          <MappingStage session={session} schemas={schemas} onNext={handleNext} onBack={handleBack} />
        )}
        {stage === 'target' && (
          <TargetStage session={session} schemas={schemas} onNext={handleNext} onBack={handleBack} />
        )}
        {stage === 'review' && (
          <ReviewStage session={session} schemas={schemas} onNext={handleNext} onBack={handleBack} />
        )}
        {stage === 'execute' && (
          <ExecuteStage session={session} schemas={schemas} saveItem={saveItem} onDone={onClose} onReset={handleReset} />
        )}
      </div>
    </>
  );

  if (mode === 'panel') {
    return (
      <div className="h-full flex flex-col bg-background overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 rounded-3xl overflow-hidden border border-border bg-background shadow-2xl">
        <DialogTitle className="sr-only">Asistente de Importacion de Catalogo</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function ImportWizardHeader({ stage }: { stage: Stage }) {
  const currentIdx = STAGES.findIndex(s => s.key === stage);

  return (
    <header className="border-b p-6 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-foreground">Import Wizard</h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-75">
            Carga de materia estructurada y definición de blueprints
          </p>
        </div>
      </div>

      {/* Step map track bubbles */}
      <div className="flex items-center gap-2 select-none self-center md:self-auto">
        {STAGES.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all border shrink-0",
                  isDone && "bg-primary border-primary text-primary-foreground",
                  isActive && "bg-primary/10 border-primary text-primary shadow-sm scale-110",
                  !isDone && !isActive && "bg-background border-border text-muted-foreground"
                )}>
                  {isDone ? <Check size={10} strokeWidth={3} /> : idx + 1}
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider hidden sm:inline",
                  isActive ? "text-primary font-black" : "text-muted-foreground/60"
                )}>
                  {step.label}
                </span>
              </div>
              {idx < STAGES.length - 1 && (
                <ArrowRight size={10} className="text-muted-foreground/30 hidden sm:inline mx-1" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </header>
  );
}
