if (typeof window !== 'undefined') {
  throw new Error('activeProject can only be used on the server.');
}

if (process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('server-only');
}

import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

export function getSiloPath(): string {
  return STORAGE_ROOT;
}

export function getStorageRoot(): string {
  return STORAGE_ROOT;
}
