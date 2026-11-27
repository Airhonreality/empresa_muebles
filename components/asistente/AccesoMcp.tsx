'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/veta/button';
import { InputField } from '@/components/veta/input-field';
import { ETIQUETA_TOKEN_MAX } from '@/lib/mcp/opciones';
import { llamarAsistente } from './api';

/** Vista de un token: nunca incluye el token en claro ni el hash. */
interface TokenVista {
  id: string;
  etiqueta: string;
  creadoEn: string;
  ultimoUsoEn: string | null;
  estado: 'activo' | 'revocado';
}

function fecha(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('es-CO') : 'Nunca';
}

/**
 * Acceso MCP del propio usuario. Cada quien gestiona SUS tokens: el servidor filtra por la sesión.
 * El token en claro aparece una sola vez, justo después de crearlo, con botón de copiar.
 */
export function AccesoMcp() {
  const [tokens, setTokens] = useState<TokenVista[]>([]);
  const [etiqueta, setEtiqueta] = useState('');
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const r = await llamarAsistente<{ tokens: TokenVista[] }>('/api/asistente/tokens-mcp');
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudieron cargar tus accesos.');
      return;
    }
    setTokens(r.data.tokens);
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function crear() {
    setError(null);
    setAviso(null);
    setCopiado(false);
    const r = await llamarAsistente<{ token: string }>('/api/asistente/tokens-mcp', {
      method: 'POST',
      body: JSON.stringify({ etiqueta }),
    });
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo crear el acceso.');
      return;
    }
    setNuevo(r.data.token);
    setEtiqueta('');
    await cargar();
  }

  async function revocar(id: string) {
    setError(null);
    setAviso(null);
    const r = await llamarAsistente<{ ok: boolean }>(`/api/asistente/tokens-mcp?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo revocar el acceso.');
      return;
    }
    setAviso('Acceso revocado. Deja de funcionar en la siguiente llamada.');
    await cargar();
  }

  async function copiar() {
    if (!nuevo) return;
    try {
      await navigator.clipboard.writeText(nuevo);
      setCopiado(true);
    } catch {
      setError('No se pudo copiar. Selecciona el texto y cópialo a mano.');
    }
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="mcp-titulo">
      <div className="flex flex-col gap-1">
        <h3 id="mcp-titulo" className="font-semibold text-text-heading">Acceso MCP</h3>
        <p className="text-sm text-text-muted">
          Crea un token para conectar un cliente MCP (por ejemplo, Claude) a tu cuenta. Usa tus mismos permisos.
          El token se muestra una sola vez: guárdalo en un lugar seguro.
        </p>
      </div>

      {aviso && <p role="status" className="text-sm text-text-primary">{aviso}</p>}
      {error && <p role="alert" className="text-sm text-error-stroke">{error}</p>}

      {nuevo && (
        <div role="status" className="flex flex-col gap-2 rounded-sm border border-border-subtle p-3">
          <p className="text-sm font-medium text-text-heading">Copia tu token ahora. No se volverá a mostrar.</p>
          <code className="break-all rounded-sm bg-bg-surface px-2 py-1 text-sm">{nuevo}</code>
          <div className="flex items-center gap-3">
            <Button size="md" onClick={() => void copiar()}>Copiar token</Button>
            {copiado && <span className="text-sm text-text-muted">Copiado.</span>}
            <Button variant="outline" size="md" onClick={() => setNuevo(null)}>Ya lo guardé</Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <InputField
          label="Etiqueta del token (para identificarlo)"
          maxLength={ETIQUETA_TOKEN_MAX}
          autoComplete="off"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
        />
        <Button size="md" className="self-start" onClick={() => void crear()} disabled={etiqueta.trim().length === 0}>
          Crear token
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-text-heading">Tus tokens</h4>
        {tokens.length === 0 && <p className="text-sm text-text-muted">Todavía no tienes tokens.</p>}
        <ul className="flex flex-col gap-2">
          {tokens.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-border-subtle p-3 text-sm">
              <span className="font-medium">{t.etiqueta}</span>
              <span className="text-text-muted">Creado: {fecha(t.creadoEn)}</span>
              <span className="text-text-muted">Último uso: {fecha(t.ultimoUsoEn)}</span>
              <span className="text-text-muted">{t.estado === 'activo' ? 'Activo' : 'Revocado'}</span>
              {t.estado === 'activo' && (
                <Button variant="destructive" size="md" className="ml-auto" onClick={() => void revocar(t.id)}>
                  Revocar {t.etiqueta}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
