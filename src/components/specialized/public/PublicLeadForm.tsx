'use client';

import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';

type LeadForm = { nombre_completo: string; telefono_whatsapp: string; email: string; barrio_zona: string; tipo_espacio: 'Cocina' | 'Closet' | 'Centro de TV' | 'Oficina' | 'Otro'; estado_proyecto: 'Tengo diseño y medidas' | 'Necesito que me visiten y asesoren'; mensaje: string; };
const initialForm: LeadForm = { nombre_completo: '', telefono_whatsapp: '', email: '', barrio_zona: '', tipo_espacio: 'Cocina', estado_proyecto: 'Tengo diseño y medidas', mensaje: '' };
const attribution = () => typeof window === 'undefined' ? {} : ({ gclid: sessionStorage.getItem('veta_gclid') || '', utm_source: sessionStorage.getItem('veta_utm_source') || '', utm_medium: sessionStorage.getItem('veta_utm_medium') || '', utm_campaign: sessionStorage.getItem('veta_utm_campaign') || '' });

export default function PublicLeadForm() {
  const [form, setForm] = useState<LeadForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const update = <K extends keyof LeadForm>(key: K, value: LeadForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true); setMessage(null);
    try {
      const response = await fetch('/api/public/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...attribution() }) });
      const result = await response.json() as { error?: string; whatsapp_url?: string };
      if (!response.ok || !result.whatsapp_url) throw new Error(result.error || 'No se pudo enviar la solicitud.');
      setMessage('Solicitud recibida. Abriremos WhatsApp para continuar.');
      window.open(result.whatsapp_url, '_blank', 'noopener,noreferrer');
      setForm(initialForm);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.'); } finally { setSubmitting(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Nombre completo *<input required value={form.nombre_completo} onChange={(event) => update('nombre_completo', event.target.value)} className="block min-h-11 w-full rounded-xl border bg-white px-3" /></label><label className="space-y-1 text-sm">WhatsApp *<input required value={form.telefono_whatsapp} onChange={(event) => update('telefono_whatsapp', event.target.value)} className="block min-h-11 w-full rounded-xl border bg-white px-3" /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Correo<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="block min-h-11 w-full rounded-xl border bg-white px-3" /></label><label className="space-y-1 text-sm">Zona<input value={form.barrio_zona} onChange={(event) => update('barrio_zona', event.target.value)} className="block min-h-11 w-full rounded-xl border bg-white px-3" /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Espacio<select value={form.tipo_espacio} onChange={(event) => update('tipo_espacio', event.target.value as LeadForm['tipo_espacio'])} className="block min-h-11 w-full rounded-xl border bg-white px-3">{['Cocina', 'Closet', 'Centro de TV', 'Oficina', 'Otro'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="space-y-1 text-sm">Estado<select value={form.estado_proyecto} onChange={(event) => update('estado_proyecto', event.target.value as LeadForm['estado_proyecto'])} className="block min-h-11 w-full rounded-xl border bg-white px-3"><option>Tengo diseño y medidas</option><option>Necesito que me visiten y asesoren</option></select></label></div>
    <label className="space-y-1 text-sm">Mensaje<textarea value={form.mensaje} onChange={(event) => update('mensaje', event.target.value)} className="block min-h-28 w-full rounded-xl border bg-white px-3 py-2" /></label>
    {message ? <p role="status" className="text-sm text-[hsl(var(--veta-text-stone))]">{message}</p> : null}
    <button disabled={submitting} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-wider text-black disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continuar a WhatsApp</button>
  </form>;
}
