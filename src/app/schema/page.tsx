'use client';

/**
 * 🏗️ SYSTEM ARCHITECT PORTAL
 * ───────────────
 * CAPA: Sovereignty Layer (Management)
 * 
 * ROLE: Proporciona el acceso a pantalla completa al Config Manager.
 */

import { AgnosticDesigner } from '@/components/agnostic/designer/AgnosticDesigner';

export default function SchemaPage() {
  return (
    <div className="h-screen w-screen bg-background">
      <AgnosticDesigner />
    </div>
  );
}
