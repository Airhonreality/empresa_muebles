'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '@/context/AppContext';
import { processEvents } from '@/lib/agnostic/eventProcessor';
import { getCommercialValue, normalizeWhatsappDestination } from '@/lib/veta/config';

type EmbudoMode = 'page' | 'modal';

type LeadsSchemaField = {
  key: string;
  label?: string;
  required?: boolean;
};

const tipoEspacioOptions = [
  { label: 'Cocina', value: 'Cocina' },
  { label: 'Clóset / Vestier', value: 'Closet' },
  { label: 'Centro de TV', value: 'Centro de TV' },
  { label: 'Oficina / Estudio', value: 'Oficina' },
  { label: 'Otro', value: 'Otro' },
];

const estadoProyectoOptions = [
  { label: 'Tengo diseño y medidas', value: 'Tengo diseño y medidas' },
  { label: 'Necesito que me visiten y asesoren', value: 'Necesito que me visiten y asesoren' },
];

export function VetaEmbudoForm({ mode = 'page', onSuccess }: { mode?: EmbudoMode; onSuccess?: () => void }) {
  const { data, system: { schemas } } = useAppState();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const leadsSchema = schemas.find((schema: any) => schema.data?.name === 'leads');
  const schemaFields = (leadsSchema?.data?.fields ?? []) as LeadsSchemaField[];
  const configRecords = data['configuracion_comercial'] || [];
  const whatsappDestination = normalizeWhatsappDestination(
    getCommercialValue(configRecords, 'whatsapp_number', '+57 300 123 4567')
  );

  const fieldMap = useMemo(() => {
    return schemaFields.reduce<Record<string, LeadsSchemaField>>((acc, field) => {
      acc[field.key] = field;
      return acc;
    }, {});
  }, [schemaFields]);

  useEffect(() => {
    const initialValues: Record<string, string> = {
      tipo_espacio: tipoEspacioOptions[0].value,
      estado_proyecto: estadoProyectoOptions[0].value,
      nombre_completo: '',
      telefono_whatsapp: '',
      email: '',
      barrio_zona: '',
      mensaje: '',
    };
    setForm(initialValues);
  }, [leadsSchema]);

  const setValue = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const visibleLabel = (key: string, fallback: string) => fieldMap[key]?.label || fallback;

  const submitLead = async () => {
    setLoading(true);
    setError(null);

    try {
      const gclid = typeof window !== 'undefined' ? window.sessionStorage.getItem('veta_gclid') || '' : '';
      const utmSource = typeof window !== 'undefined' ? window.sessionStorage.getItem('veta_utm_source') || '' : '';
      const utmMedium = typeof window !== 'undefined' ? window.sessionStorage.getItem('veta_utm_medium') || '' : '';
      const utmCampaign = typeof window !== 'undefined' ? window.sessionStorage.getItem('veta_utm_campaign') || '' : '';

      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap: 'capturar_lead_embudo',
          payload: {
            ...form,
            gclid,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            whatsapp_destino: whatsappDestination,
          },
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo registrar el lead');
      }

      await processEvents(result.events ?? []);
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      setError('Hubo un error al registrar tu solicitud. Por favor intenta de nuevo.');
      toast.error('No se pudo completar el embudo.');
    } finally {
      setLoading(false);
    }
  };

  const renderOptionGroup = (
    title: string,
    fieldKey: string,
    options: Array<{ label: string; value: string }>
  ) => (
    <fieldset className="space-y-3">
      <legend className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--veta-text-stone))]">
        {title}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = form[fieldKey] === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue(fieldKey, option.value)}
              className={[
                'min-h-12 rounded-xl border px-4 py-3 text-left transition-all duration-300',
                'bg-white/70 text-[hsl(var(--veta-text-carbon))]',
                active
                  ? 'border-[hsl(var(--veta-gold-hover))] bg-[hsl(var(--veta-bg-linen))] shadow-[0_10px_30px_rgba(0,0,0,0.06)]'
                  : 'border-[hsl(var(--veta-glass-light-border))] hover:border-[hsl(var(--veta-gold-muted))] hover:bg-white',
              ].join(' ')}
            >
              <span className="block text-sm font-semibold leading-snug">{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  if (success) {
    return (
      <div className="veta-surface-glass rounded-2xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[hsl(var(--veta-gold-muted))]/30 bg-[hsl(var(--veta-bg-linen))]">
          <Sparkles className="h-8 w-8 text-[hsl(var(--veta-gold-hover))]" />
        </div>
        <h3 className="veta-heading text-2xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))]">
          ¡Solicitud recibida!
        </h3>
        <p className="mt-2 text-sm text-[hsl(var(--veta-text-stone))]">
          Ya registramos tu solicitud y abrimos WhatsApp para continuar la conversación.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setStep(1);
          }}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-[hsl(var(--veta-gold-muted))]/30 px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--veta-text-carbon))] transition-colors hover:bg-[hsl(var(--veta-bg-linen))]"
        >
          Enviar otro lead
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (step === 1) {
          setStep(2);
          return;
        }
        void submitLead();
      }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[hsl(var(--veta-gold-hover))]">
        <Sparkles className="h-4 w-4" />
        <span>Embudo híbrido</span>
      </div>

      <div className="space-y-2">
        <h3 className="veta-heading text-2xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))]">
          {step === 1 ? 'Cuéntanos qué necesitas' : 'Deja tus datos de contacto'}
        </h3>
        <p className="text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
          {step === 1
            ? 'Primero filtramos el tipo de proyecto y el estado actual de tu espacio.'
            : 'Después registramos tu contacto y te enviamos a WhatsApp con el mensaje prellenado.'}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-5">
          {renderOptionGroup('¿Qué espacio necesitas?', 'tipo_espacio', tipoEspacioOptions)}
          {renderOptionGroup('Estado de tu proyecto', 'estado_proyecto', estadoProyectoOptions)}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--veta-text-stone))]">
                {visibleLabel('nombre_completo', 'Nombre completo')} *
              </span>
              <input
                value={form.nombre_completo || ''}
                onChange={(event) => setValue('nombre_completo', event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[hsl(var(--veta-glass-light-border))] bg-white/80 px-4 text-sm text-[hsl(var(--veta-text-carbon))] outline-none transition focus:border-[hsl(var(--veta-gold-hover))]"
                placeholder="Tu nombre"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--veta-text-stone))]">
                {visibleLabel('telefono_whatsapp', 'Teléfono / WhatsApp')} *
              </span>
              <input
                value={form.telefono_whatsapp || ''}
                onChange={(event) => setValue('telefono_whatsapp', event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[hsl(var(--veta-glass-light-border))] bg-white/80 px-4 text-sm text-[hsl(var(--veta-text-carbon))] outline-none transition focus:border-[hsl(var(--veta-gold-hover))]"
                placeholder="+57 300 000 0000"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--veta-text-stone))]">
                {visibleLabel('email', 'Correo electrónico')}
              </span>
              <input
                value={form.email || ''}
                onChange={(event) => setValue('email', event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[hsl(var(--veta-glass-light-border))] bg-white/80 px-4 text-sm text-[hsl(var(--veta-text-carbon))] outline-none transition focus:border-[hsl(var(--veta-gold-hover))]"
                placeholder="correo@ejemplo.com"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--veta-text-stone))]">
                {visibleLabel('barrio_zona', 'Barrio / Zona')}
              </span>
              <input
                value={form.barrio_zona || ''}
                onChange={(event) => setValue('barrio_zona', event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[hsl(var(--veta-glass-light-border))] bg-white/80 px-4 text-sm text-[hsl(var(--veta-text-carbon))] outline-none transition focus:border-[hsl(var(--veta-gold-hover))]"
                placeholder="Cedritos, Rosales, Chicó..."
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--veta-text-stone))]">
              {visibleLabel('mensaje', 'Mensaje')}
            </span>
            <textarea
              value={form.mensaje || ''}
              onChange={(event) => setValue('mensaje', event.target.value)}
              className="min-h-32 w-full resize-none rounded-xl border border-[hsl(var(--veta-glass-light-border))] bg-white/80 px-4 py-3 text-sm text-[hsl(var(--veta-text-carbon))] outline-none transition focus:border-[hsl(var(--veta-gold-hover))]"
              placeholder="Cuéntanos una referencia rápida del proyecto."
            />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="min-h-12 rounded-full border border-[hsl(var(--veta-glass-light-border))] px-5 text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--veta-text-carbon))] transition-colors hover:bg-white"
          >
            Volver
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition-all hover:bg-[hsl(var(--veta-gold-hover))] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Registrando</span>
            </>
          ) : step === 1 ? (
            <>
              <span>Continuar</span>
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Continuar a WhatsApp</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
