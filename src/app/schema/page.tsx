'use client';

/**
 * 🏗️ SYSTEM ARCHITECT PORTAL
 * ───────────────
 * CAPA: Sovereignty Layer (Management)
 * 
 * ROLE: Proporciona el acceso a pantalla completa al Config Manager.
 */

import { AgnosticDesigner } from '@/components/agnostic/designer/AgnosticDesigner';
import { AgnosticGuard } from '@/components/agnostic/layouts/AgnosticGuard';

export default function SchemaPage() {
  return (
    <AgnosticGuard requiredRole="admin">
      <div className="h-screen w-screen bg-background">
        <AgnosticDesigner />
      </div>
    </AgnosticGuard>
  );
}
