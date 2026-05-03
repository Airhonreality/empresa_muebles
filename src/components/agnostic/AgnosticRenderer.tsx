'use client';

import React from 'react';
import { AgnosticForm } from './AgnosticForm';
import { AgnosticModuleLoader } from './AgnosticModuleLoader';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppContext';
import { toast } from 'sonner';

// --- Placeholder components for the Base Library ---
const AgnosticHero = ({ title, description }: any) => (
  <div className="py-24 px-8 bg-muted/10 rounded-3xl text-center space-y-4 border border-border/20">
    <h1 className="text-6xl font-black tracking-tighter">{title}</h1>
    <p className="text-xl text-muted-foreground italic max-w-2xl mx-auto">{description}</p>
  </div>
);

const AgnosticTable = ({ schemaId }: any) => (
  <div className="p-12 border-2 border-dashed border-primary/20 rounded-3xl text-center">
    <p className="text-xs font-black uppercase tracking-[0.4em] opacity-20">Agnostic Table for '{schemaId}' coming soon...</p>
  </div>
);

/**
 * CustomActorBridge: The most radical part of the system.
 * It provides a raw DOM container to an external script from storage.
 */
const CustomActorBridge = ({ moduleName, api }: { moduleName: string, api: any }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <AgnosticModuleLoader 
      moduleName={moduleName} 
      api={{ ...api, container: containerRef.current }}
    >
      <div ref={containerRef} className="w-full min-h-[100px]" id={`custom-module-${moduleName}`} />
    </AgnosticModuleLoader>
  );
};

interface BlockProps {
  block: any;
}

/**
 * AgnosticRenderer: The Universal Projector.
 * Decides which 'Actor' should render a piece of Materia based on its type.
 */
export function AgnosticRenderer({ block }: BlockProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { state } = useAppState();

  const commonApi = {
    user,
    router,
    state,
    notify: toast
  };

  switch (block.type) {
    case 'hero':
      return <AgnosticHero {...block} />;
    
    case 'form':
      return (
        <AgnosticForm 
          schemaId={block.schemaId} 
          title={block.title} 
          description={block.description} 
          logicModule={block.moduleName}
          onSubmit={(data) => {
            toast.success(`Data received for ${block.schemaId}`);
            console.log(`[Renderer] ${block.schemaId} Submit:`, data);
          }}
        />
      );

    case 'table':
      return <AgnosticTable schemaId={block.schemaId} />;

    case 'custom':
      return <CustomActorBridge moduleName={block.moduleName} api={commonApi} />;

    default:
      return (
        <div className="p-4 bg-destructive/5 text-destructive rounded-xl text-[10px] font-bold">
          Unknown Actor Type: {block.type}
        </div>
      );
  }
}
