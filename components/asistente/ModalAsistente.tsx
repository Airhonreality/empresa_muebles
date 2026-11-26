'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/veta/modal';
import { Button, buttonClassName } from '@/components/veta/button';
import { MarkdownContent } from '@/components/veta/markdown-content';
import { llamarAsistente } from './api';
import { PanelConfiguracion } from './PanelConfiguracion';

type Pestana = 'chat' | 'historial' | 'configuracion';
interface Mensaje { rol: 'usuario' | 'asistente' | 'herramienta'; contenido: string }
interface Propuesta { id: string; herramienta: string; resumen: string; venceEn: string }
interface Resumen { id: string; titulo: string; actualizadaEn: string }

const LARGO_MAXIMO = 4000;

export function ModalAsistente({ open, onClose, puedeConfigurar }: { open: boolean; onClose: () => void; puedeConfigurar: boolean }) {
  const [pestana, setPestana] = useState<Pestana>('chat');
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [borrador, setBorrador] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Resumen[] | null>(null);
  const finalRef = useRef<HTMLDivElement>(null);

  const cargarHistorial = useCallback(async () => {
    const r = await llamarAsistente<{ conversaciones: Resumen[] }>('/api/asistente/conversaciones');
    if (r.ok) setHistorial(r.data.conversaciones);
    else setError(r.data.error ?? 'No se pudo cargar el historial.');
  }, []);

  useEffect(() => {
    if (open && pestana === 'historial') void cargarHistorial();
  }, [open, pestana, cargarHistorial]);

  useEffect(() => {
    finalRef.current?.scrollIntoView({ block: 'end' });
  }, [mensajes, enviando]);

  async function abrirConversacion(id: string) {
    setError(null);
    const r = await llamarAsistente<{ mensajes: Mensaje[]; propuestas: Propuesta[] }>(`/api/asistente/conversaciones/${id}`);
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo abrir la conversación.');
      return;
    }
    setConversacionId(id);
    setMensajes(r.data.mensajes);
    setPropuestas(r.data.propuestas);
    setPestana('chat');
  }

  function nuevaConversacion() {
    setConversacionId(null);
    setMensajes([]);
    setPropuestas([]);
    setError(null);
    setBorrador('');
    setPestana('chat');
  }

  async function enviar() {
    const texto = borrador.trim();
    if (!texto || enviando) return;
    setError(null);
    setEnviando(true);
    setMensajes((m) => [...m, { rol: 'usuario', contenido: texto }]);
    setBorrador('');
    const r = await llamarAsistente<{ respuesta: string; conversacionId: string; alerta?: string }>('/api/asistente', {
      method: 'POST',
      body: JSON.stringify({ mensaje: texto, ...(conversacionId ? { conversacionId } : {}) }),
    });
    setEnviando(false);
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo responder. Intenta de nuevo.');
      return;
    }
    setConversacionId(r.data.conversacionId);
    setMensajes((m) => [...m, { rol: 'asistente', contenido: r.data.respuesta }]);
    if (r.data.alerta) setError(r.data.alerta);
    const detalle = await llamarAsistente<{ propuestas: Propuesta[] }>(`/api/asistente/conversaciones/${r.data.conversacionId}`);
    if (detalle.ok) setPropuestas(detalle.data.propuestas);
  }

  async function resolver(id: string, accion: 'confirmar' | 'cancelar') {
    setError(null);
    const r = await llamarAsistente<{ estado: string }>(`/api/asistente/propuestas/${id}`, {
      method: 'POST',
      body: JSON.stringify({ accion }),
    });
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo resolver la propuesta.');
      return;
    }
    setPropuestas((p) => p.filter((x) => x.id !== id));
  }

  function alTeclear(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void enviar();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Asistente" maxWidthClassName="max-w-3xl">
      <div className="flex flex-col gap-4">
        <nav className="flex flex-wrap gap-2" aria-label="Secciones del asistente">
          <Button variant={pestana === 'chat' ? 'primary' : 'outline'} size="md" onClick={() => setPestana('chat')}>Chat</Button>
          <Button variant={pestana === 'historial' ? 'primary' : 'outline'} size="md" onClick={() => setPestana('historial')}>Historial</Button>
          {puedeConfigurar && (
            <Button variant={pestana === 'configuracion' ? 'primary' : 'outline'} size="md" onClick={() => setPestana('configuracion')}>Configuración</Button>
          )}
        </nav>

        {error && (
          <p role="alert" className="rounded-sm border border-error-stroke px-3 py-2 text-sm text-error-stroke">
            {error}
          </p>
        )}

        {pestana === 'chat' && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Button variant="ghost" size="md" onClick={nuevaConversacion}>Nueva conversación</Button>
            </div>
            <div className="flex max-h-[50vh] min-h-[12rem] flex-col gap-3 overflow-y-auto" aria-live="polite">
              {mensajes.length === 0 && !enviando && (
                <p className="text-sm text-text-muted">Pregunta por una cotización, un proyecto o el saldo de caja.</p>
              )}
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  className={m.rol === 'usuario' ? 'ml-auto max-w-[85%] whitespace-pre-wrap rounded-sm bg-bg-paper px-3 py-2 text-text-primary' : 'max-w-[85%] rounded-sm px-3 py-2'}
                >
                  {m.rol === 'asistente' ? <MarkdownContent value={m.contenido} variant="compacto" /> : m.contenido}
                </div>
              ))}
              {enviando && <p className="text-sm text-text-muted">El asistente está respondiendo…</p>}
              {propuestas.map((p) => (
                <div key={p.id} className="rounded-sm border border-border-subtle p-3">
                  <p className="text-sm text-text-primary">{p.resumen}</p>
                  <p className="text-xs text-text-muted">Vence: {new Date(p.venceEn).toLocaleString('es-CO')}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="md" onClick={() => resolver(p.id, 'confirmar')}>Confirmar</Button>
                    <Button variant="outline" size="md" onClick={() => resolver(p.id, 'cancelar')}>Cancelar</Button>
                  </div>
                </div>
              ))}
              <div ref={finalRef} />
            </div>
            <div className="flex flex-col gap-2">
              <textarea
                value={borrador}
                onChange={(e) => setBorrador(e.target.value.slice(0, LARGO_MAXIMO))}
                onKeyDown={alTeclear}
                rows={3}
                aria-label="Mensaje para el asistente"
                placeholder="Escribe tu mensaje (Enter envía, Shift+Enter salto de línea)"
                className="w-full rounded-sm border border-border-subtle bg-bg-paper p-3 text-base text-text-primary outline-none focus:border-brand"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-text-muted">{borrador.length}/{LARGO_MAXIMO}</span>
                <Button size="md" onClick={() => void enviar()} disabled={enviando || borrador.trim() === ''} loading={enviando}>
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        )}

        {pestana === 'historial' && (
          <div className="flex flex-col gap-2">
            {historial === null && <p className="text-sm text-text-muted">Cargando…</p>}
            {historial?.length === 0 && <p className="text-sm text-text-muted">Aún no tienes conversaciones.</p>}
            {historial?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void abrirConversacion(c.id)}
                className={`${buttonClassName('ghost', 'md', 'justify-start text-left')} min-h-[44px]`}
              >
                <span className="truncate">{c.titulo}</span>
                <span className="ml-auto text-xs text-text-muted">{new Date(c.actualizadaEn).toLocaleDateString('es-CO')}</span>
              </button>
            ))}
          </div>
        )}

        {pestana === 'configuracion' && puedeConfigurar && <PanelConfiguracion />}
      </div>
    </Modal>
  );
}
