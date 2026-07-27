'use client';

import React, { useState } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { normalizeWhatsappDestination } from '@/lib/veta/config';

const WHATSAPP_DESTINATION = normalizeWhatsappDestination('+57 302 592 2101');

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

export function VetaEmbudoForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [tipoEspacio, setTipoEspacio] = useState(tipoEspacioOptions[0].value);
  const [estadoProyecto, setEstadoProyecto] = useState(estadoProyectoOptions[0].value);

  const abrirWhatsApp = () => {
    const mensaje = `Hola Veta Dorada, necesito: ${tipoEspacio}. Estado: ${estadoProyecto}.`.toLocaleLowerCase();
    window.open(`https://wa.me/${WHATSAPP_DESTINATION}?text=${encodeURIComponent(mensaje)}`, '_blank');
    onSuccess?.();
  };

  const renderOptionGroup = (
    title: string,
    options: Array<{ label: string; value: string }>,
    selected: string,
    onSelect: (value: string) => void
  ) => (
    <fieldset className="space-y-3">
      <legend className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--veta-text-stone))]">
        {title}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="veta-heading text-2xl font-semibold tracking-tight text-[hsl(var(--veta-text-carbon))]">
          Cuéntanos qué necesitas
        </h3>
        <p className="text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
          Selecciona el tipo de espacio y el estado de tu proyecto para iniciar la conversación.
        </p>
      </div>

      <div className="space-y-5">
        {renderOptionGroup(
          '¿Qué espacio necesitas?',
          tipoEspacioOptions,
          tipoEspacio,
          setTipoEspacio
        )}
        {renderOptionGroup(
          'Estado de tu proyecto',
          estadoProyectoOptions,
          estadoProyecto,
          setEstadoProyecto
        )}
      </div>

      <button
        type="button"
        onClick={abrirWhatsApp}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition-all hover:bg-[hsl(var(--veta-gold-hover))]"
      >
        <MessageCircle className="h-4 w-4" />
        <span>Hablar por WhatsApp</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
