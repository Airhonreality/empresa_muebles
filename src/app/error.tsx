'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center gap-4">
      <AlertTriangle size={40} className="text-destructive" />
      <h1 className="text-2xl font-black tracking-tight">Error de Renderizado</h1>
      <pre className="text-xs text-muted-foreground bg-muted p-4 rounded-lg max-w-lg text-left overflow-auto">
        {error.message}
        {error.digest && `\nDigest: ${error.digest}`}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
      >
        Reintentar
      </button>
    </div>
  );
}
