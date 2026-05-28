/**
 * /_data/[schema] — Universal Schema Explorer (DataBrowser SSR Entry)
 *
 * Loads schema definition + all records server-side, then hands off
 * to the DataBrowser client component for interactive CRUD.
 *
 * AXIOMATIC_CONTRACT:
 * - MUST: Resolve schema by name from SYSTEM_NS.SCHEMAS
 * - MUST: Load all records for that schema namespace via getVaultData
 * - NEVER: Add business logic or transformations here
 */

import { notFound } from 'next/navigation';
import { getVaultData } from '@/core/server/vault';
import { SYSTEM_NS } from '@/lib/agnostic/constants';
import { DataBrowser } from '@/components/specialized/DataBrowser';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ schema: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function DataPage({ params, searchParams }: PageProps) {
  const { schema: schemaName } = await params;
  const { view } = await searchParams;

  const data = await getVaultData([SYSTEM_NS.SCHEMAS, schemaName]);
  const schemas = (data[SYSTEM_NS.SCHEMAS] ?? []) as any[];
  const schemaItem = schemas.find(
    (s: any) => s.data?.name === schemaName || s.data?.slug === schemaName
  );

  if (!schemaItem) notFound();

  const records = (data[schemaName] ?? []) as any[];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <DataBrowser
        schemaName={schemaName}
        schema={schemaItem.data}
        initialRecords={records}
        initialView={(view as 'sheets' | 'cards' | 'form') ?? 'sheets'}
      />
    </div>
  );
}
