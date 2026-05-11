'use client';

/**
 * 🏗️ SYSTEM ARCHITECT PORTAL
 * ───────────────
 * CAPA: Sovereignty Layer (Management)
 * 
 * ROLE: Proporciona el acceso a pantalla completa al Config Manager.
 */

import { AgnosticConfigManager } from '@/components/agnostic/designer/AgnosticConfigManager';

export default function SchemaPage() {
  return (
    <div className="h-screen w-screen bg-[#FAF9F6]">
      <AgnosticConfigManager isFullScreen={true} />
    </div>
  );
}
