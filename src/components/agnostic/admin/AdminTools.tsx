'use client';

import dynamic from 'next/dynamic';
import { useAdminGate } from '@/hooks/useAdminGate';

const AdminGear = dynamic(() => import('./AdminGear').then(m => m.AdminGear), { ssr: false });
const AgnoChat  = dynamic(() => import('./AgnoChat').then(m => m.AgnoChat),   { ssr: false });

/**
 * Gate before dynamic import: for the common case (non-admin visitor on a
 * public route) neither AdminGear's ConfigManager/AgnosticDesigner bundle
 * nor AgnoChat's chat bundle is ever requested — isAdmin is cheap (reads a
 * boolean from the client store), the heavy component trees are not.
 */
export function AdminTools() {
  const isAdmin = useAdminGate();
  if (!isAdmin) return null;

  return (
    <>
      <AdminGear />
      <AgnoChat />
    </>
  );
}
