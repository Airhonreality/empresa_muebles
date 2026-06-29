if (typeof window !== 'undefined') {
  throw new Error('activeProject can only be used on the server.');
}

if (process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('server-only');
}

import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

export function getProjectStorageRoot(): string {
  return STORAGE_ROOT;
}

export function getStorageRoot(): string {
  return STORAGE_ROOT;
}

/**
 * @deprecated Runtime tenancy/silo selection was removed. Use
 * getProjectStorageRoot() or getStorageRoot() for the single fork storage root.
 */
export function getSiloPath(): string {
  return getProjectStorageRoot();
}
