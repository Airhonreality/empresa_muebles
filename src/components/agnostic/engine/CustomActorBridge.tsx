/**
 * 🏛️ ARTEFACTO: CustomActorBridge.tsx
 * ────────────
 * CAPA: Projection (Engine)
 * VERSIÓN: 6.0
 * COMMIT: P2-M1.6-BRIDGE-EXTRACTION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Proveer un contenedor estable para módulos invitados (Satélites).
 * - Inyectar el contenedor DOM en la API del módulo.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Mantener un ID de contenedor estable para evitar re-hidrataciones innecesarias.
 * - NEVER: Contener lógica de negocio del satélite.
 */
'use client';

import React, { memo } from 'react';
import { AgnosticModuleLoader } from './AgnosticModuleLoader';

const StableContainer = memo(
  ({ id }: { id: string }) => (
    <div id={id} className="w-full" />
  ),
  () => true
);
StableContainer.displayName = 'StableContainer';

export const CustomActorBridge = ({ moduleName, api }: { moduleName: string, api: any }) => {
  const id = React.useId().replace(/:/g, "");
  const containerId = `custom-module-${moduleName}-${id}`;

  return (
    <div className="w-full">
      <StableContainer id={containerId} />
      <AgnosticModuleLoader
        moduleName={moduleName}
        api={{
          ...api,
          get container() {
            return typeof document !== 'undefined' ? document.getElementById(containerId) : null;
          }
        }}
      />
    </div>
  );
};
