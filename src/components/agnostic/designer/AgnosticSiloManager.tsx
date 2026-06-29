/**
 * @deprecated Runtime silo management was removed.
 *
 * Kept as a compatibility export for older designer imports. The active
 * contract is seed + project forks with a single storage root at storage/.
 */

import React from 'react';
import { Database } from 'lucide-react';

export const AgnosticSiloManager: React.FC = () => {
  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">Storage Manager</h2>
          <p className="text-sm text-muted-foreground">
            Runtime silo selection was removed. This fork uses a single storage root at <code>storage/</code>.
          </p>
        </div>
      </div>
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        Use the Config Manager, MCP bridge, or Agno CLI for semantic edits. Engine updates should arrive through
        Git upstream merges, not runtime tenant switching.
      </div>
    </div>
  );
};
