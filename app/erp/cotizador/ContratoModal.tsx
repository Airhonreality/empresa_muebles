"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/veta/button";
import { InputField } from "@/components/veta/input-field";
import { MoneyInput } from "@/components/veta/money-input";
import { useRouter } from "next/navigation";
import { useCotizadorCompat } from "@/lib/data/queries/cotizador-compat";
import {
  SECCIONES_ESPECIFICACIONES,
  compilarEspecificaciones,
  compilarObjetoItems,
  tieneItemsDeLaCategoria,
  type SeccionEspecificacion,
} from "@/lib/data/contrato-items";
import type {
  Proyecto, Cliente, EspacioVariante, ItemVariante, ProductoCatalogo, Contrato,
  HitoPago, DatosContratoEdicion,
} from "@/lib/data";
import { usePendingGuard } from "@/lib/hooks/usePendingGuard";

export interface ContratoModalProps {
  proyecto: Proyecto;
  cliente: Cliente | undefined;
  espacios: EspacioVariante[];
  itemsPorEspacio: Map<string, ItemVariante[]>;
  catalogo: ProductoCatalogo[];
  valorTotalCotizacion: number;
  /** t-166: contrato ya emitido de este proyecto, si existe. Su presencia cambia el modal de
   *  "alta" a "edición": precarga todos los campos y hace UPDATE en vez de INSERT. Antes esta
   *  prop no existía, y por eso reabrir el modal perdía todo lo escrito. */
  contratoExistente?: Contrato;
  hitosExistentes?: HitoPago[];
  onClose: () => void;
  onSaved: (contrato: Contrato) => void;
}

// Tipos locales para el formulario
type HitoLocal = {
  orden: number;
  tipo: 'percentage' | 'fixed';
  montoOPorcentaje: string;
  razon: string;
  fechaLimite?: string;
};

type FormContrato = {
  codigoContrato: string;
  fechaContrato: string;
  valorTotal: string;
  plazoEjecucionTexto: string;
  holguraDias: string;
  garantiaAnios: number;
  objetoItems: string;
  especificaciones: Record<SeccionEspecificacion, string>;
};

export function ContratoModal({ proyecto, cliente, espacios, itemsPorEspacio, catalogo, valorTotalCotizacion, contratoExistente, hitosExistentes, onClose, onSaved }: ContratoModalProps) {
  const router = useRouter();
  // t-166: escribe por el MISMO layer que lee la pantalla (snapshot de TanStack). Antes usaba
  // `useDataStore()` —el store global drizzle— y por eso la edición del cliente tardaba hasta
  // el siguiente ciclo de long-poll en verse en pantalla.
  const { store } = useCotizadorCompat();
  const productMap = useMemo(() => new Map(catalogo.map((p) => [p.id, p])), [catalogo]);
  const { guard: guardGuardarContrato, isPending: guardandoContrato } = usePendingGuard();

  const esEdicion = !!contratoExistente;

  // Objeto y especificaciones derivados de los ítems cotizados. Se calculan una vez por montaje
  // y quedan disponibles para el botón "Recompilar" (t-166): si el usuario edita el texto a
  // mano y después toca la cotización, recompilar es una decisión suya, no automática — pisar
  // lo que escribió sin avisar sería peor que dejarlo congelado.
  const objetoDerivado = useMemo(
    () => compilarObjetoItems(espacios, itemsPorEspacio, productMap),
    [espacios, itemsPorEspacio, productMap],
  );
  const seccionesVisibles = useMemo(
    () => SECCIONES_ESPECIFICACIONES.filter((s) => tieneItemsDeLaCategoria(espacios, itemsPorEspacio, productMap, s)),
    [espacios, itemsPorEspacio, productMap],
  );
  const especificacionesDerivadas = useMemo(
    () => ({
      Estructura: compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Estructura'),
      Herrajes: compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Herrajes'),
      Mesones: compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Mesones'),
      Desmonte: compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Desmonte'),
    }),
    [espacios, itemsPorEspacio, productMap],
  );

  // Estado del formulario de datos del contratante — editable in situ (persistido al guardar).
  const [clienteForm, setClienteForm] = useState({
    nombre: cliente?.nombre ?? '',
    documento: cliente?.documento ?? '',
    telefono: cliente?.telefono ?? '',
    email: cliente?.email ?? '',
    domicilio: cliente?.domicilio ?? '',
  });
  const setClienteCampo = (campo: keyof typeof clienteForm, valor: string) => {
    setClienteForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // t-166: si el contrato ya existe, TODOS los campos se siembran desde lo persistido. Es el
  // arreglo del bug reportado: antes cada `useState` nacía en sus defaults y reabrir el modal
  // mostraba plazo/garantía/especificaciones/hitos/valor en blanco.
  const [form, setForm] = useState<FormContrato>(() => ({
    codigoContrato: contratoExistente?.codigoContrato
      ?? `CTR-${new Date().getFullYear()}-${String(proyecto.id).slice(-4).toUpperCase()}`,
    fechaContrato: contratoExistente?.fechaContrato ?? new Date().toISOString().slice(0, 10),
    valorTotal: contratoExistente?.valorTotal ?? valorTotalCotizacion.toString(),
    plazoEjecucionTexto: contratoExistente?.plazoEjecucionTexto
      ?? (proyecto.diasEntregaEstimados ? `${Math.floor(proyecto.diasEntregaEstimados / 7)} a ${Math.ceil(proyecto.diasEntregaEstimados / 7)}` : '4 a 5'),
    holguraDias: (contratoExistente?.holguraDias ?? 8).toString(),
    garantiaAnios: contratoExistente?.garantiaAnios ?? proyecto.garantiaAnios ?? 2,
    objetoItems: contratoExistente?.objetoItems ?? objetoDerivado,
    especificaciones: {
      Estructura: contratoExistente?.especificacionesEstructura ?? especificacionesDerivadas.Estructura,
      Herrajes: contratoExistente?.especificacionesHerrajes ?? especificacionesDerivadas.Herrajes,
      Mesones: contratoExistente?.especificacionesMesones ?? especificacionesDerivadas.Mesones,
      Desmonte: contratoExistente?.especificacionesDesmonte ?? especificacionesDerivadas.Desmonte,
    },
  }));

  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  // Hitos: los ya persistidos si hay contrato (default 50/25/25 solo en el alta).
  const [hitos, setHitos] = useState<HitoLocal[]>(() => {
    const existentes = (hitosExistentes ?? []).slice().sort((a, b) => a.orden - b.orden);
    if (existentes.length > 0) {
      return existentes.map((h, i) => ({
        orden: i + 1,
        tipo: h.tipo,
        montoOPorcentaje: h.montoOPorcentaje,
        razon: h.razon ?? '',
        fechaLimite: '',
      }));
    }
    return [
      { orden: 1, tipo: 'percentage', montoOPorcentaje: '50', razon: 'Anticipo al firmar contrato', fechaLimite: '' },
      { orden: 2, tipo: 'percentage', montoOPorcentaje: '25', razon: 'Al iniciar instalación', fechaLimite: '' },
      { orden: 3, tipo: 'percentage', montoOPorcentaje: '25', razon: 'Contra entrega y acta de satisfacción', fechaLimite: '' },
    ];
  });

  // Manejar cambios en hitos
  const handleHitoChange = useCallback((index: number, field: keyof HitoLocal, value: string) => {
    setHitos((prev) => {
      const nuevo = [...prev];
      nuevo[index] = { ...nuevo[index], [field]: value };

      // Autocálculo del último hito (P-05): si el último es porcentaje y aún vale 0,
      // se rellena con el restante para cerrar la suma a 100% (5×16% + 6º = 20% restante).
      const lastIdx = nuevo.length - 1;
      if (lastIdx !== index && nuevo[lastIdx].tipo === 'percentage') {
        const sumOtros = nuevo.slice(0, lastIdx).reduce(
          (sum, h) => sum + (h.tipo === 'percentage' ? parseFloat(h.montoOPorcentaje) || 0 : 0),
          0
        );
        const restante = 100 - sumOtros;
        if (restante >= 0 && (parseFloat(nuevo[lastIdx].montoOPorcentaje) || 0) === 0) {
          nuevo[lastIdx] = { ...nuevo[lastIdx], montoOPorcentaje: restante.toFixed(2) };
        }
      }

      return nuevo;
    });
  }, []);

  // Añadir hito
  const addHito = useCallback(() => {
    const nuevoOrden = hitos.length + 1;
    setHitos((prev) => [...prev, { orden: nuevoOrden, tipo: 'percentage', montoOPorcentaje: '0', razon: '', fechaLimite: '' }]);
  }, [hitos.length]);

  // Eliminar hito
  const removeHito = useCallback((index: number) => {
    setHitos((prev) => {
      const nuevo = prev.filter((_, i) => i !== index);
      return nuevo.map((h, i) => ({ ...h, orden: i + 1 }));
    });
  }, []);

  // Calcular suma de hitos
  const sumaHitos = useMemo(() => {
    return hitos.reduce((sum, h) => sum + parseFloat(h.montoOPorcentaje) || 0, 0);
  }, [hitos]);

  // Validar que suma = valorTotal (para hitos de porcentaje)
  const todosPorcentaje = useMemo(() => hitos.every((h) => h.tipo === 'percentage'), [hitos]);
  const hitosValidos = useMemo(() => {
    if (!todosPorcentaje) return true; // Si hay hitos fijos, no validamos suma
    return Math.abs(sumaHitos - 100) < 0.01;
  }, [sumaHitos, todosPorcentaje]);

  /** t-166: vuelve a derivar objeto y especificaciones desde los ítems cotizados ahora.
   *  Explicito y a pedido, no automático: si el usuario escribió a mano y después tocó la
   *  cotización, recompilar sin avisar le borraría su texto. */
  const recompilarDesdeItems = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      objetoItems: objetoDerivado,
      especificaciones: { ...especificacionesDerivadas },
    }));
  }, [objetoDerivado, especificacionesDerivadas]);

  const construirDatos = useCallback((): DatosContratoEdicion => {
    const esp = form.especificaciones;
    return {
      fechaContrato: form.fechaContrato,
      valorTotal: form.valorTotal,
      plazoEjecucionTexto: form.plazoEjecucionTexto,
      holguraDias: parseInt(form.holguraDias) || 8,
      garantiaAnios: form.garantiaAnios,
      objetoItems: form.objetoItems.trim() || null,
      especificacionesEstructura: esp.Estructura.trim() || null,
      especificacionesHerrajes: esp.Herrajes.trim() || null,
      especificacionesMesones: esp.Mesones.trim() || null,
      especificacionesDesmonte: esp.Desmonte.trim() || null,
      contratanteDomicilio: clienteForm.domicilio.trim() || null,
      hitos: hitos.map((h) => ({ tipo: h.tipo, monto: h.montoOPorcentaje, razon: h.razon })),
    };
  }, [form, hitos, clienteForm.domicilio]);

  /**
   * t-166: alta O edición, y con el error a la vista.
   *
   * Antes esto no distinguía los dos casos y hacía siempre INSERT: como `codigo_contrato` es
   * UNIQUE y determinista por proyecto, la segunda emisión moría con un 23505 que nadie veía
   * — `handleSave` no tenía try/catch ni estado de error, así que el modal se quedaba abierto
   * sin hacer absolutamente nada. Ahora el error se muestra y nada se cierra a medias.
   */
  const guardar = useCallback(
    async (abrirImpresion: boolean) => {
      setErrorGuardado(null);
      try {
        if (cliente) {
          const nombre = clienteForm.nombre.trim();
          if (nombre) {
            await store.clientes.actualizar(cliente.id, {
              nombre,
              documento: clienteForm.documento.trim() || null,
              telefono: clienteForm.telefono.trim() || null,
              email: clienteForm.email.trim() || null,
              domicilio: clienteForm.domicilio.trim() || null,
            });
          }
        }

        const datos = construirDatos();
        const guardado = contratoExistente
          ? await store.contratos.actualizar(contratoExistente.id, datos)
          : await store.contratos.crear({
              proyectoId: proyecto.id,
              codigoContrato: form.codigoContrato,
              ...datos,
            });

        if (!guardado) {
          setErrorGuardado(
            'No se pudo guardar el contrato: el registro ya no existe. Cerrá y abrí el modal de nuevo.',
          );
          return;
        }
        onSaved(guardado);
        onClose();
        if (abrirImpresion) {
          router.push(`/erp/cotizador/${proyecto.id}/contrato`);
        }
      } catch (e) {
        setErrorGuardado(
          e instanceof Error
            ? `No se pudo guardar el contrato: ${e.message}`
            : 'No se pudo guardar el contrato. Intentá de nuevo.',
        );
      }
    },
    [cliente, clienteForm, store, contratoExistente, construirDatos, form.codigoContrato, proyecto.id, onSaved, onClose, router],
  );

  const handleGuardarBorrador = useCallback(() => guardGuardarContrato(() => guardar(false)), [guardGuardarContrato, guardar]);
  const handleGenerar = useCallback(() => guardGuardarContrato(() => guardar(true)), [guardGuardarContrato, guardar]);

  // Verificar si el formulario es válido
  const esValido = cliente && clienteForm.nombre.trim() && parseFloat(form.valorTotal) > 0 && hitosValidos && hitos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-lg border border-border-subtle bg-bg-raised shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 id="modal-title" className="text-lg font-semibold text-text-heading">
            {esEdicion ? 'Editar Contrato' : 'Generar Contrato'}
          </h2>
          <Button variant="ghost" size="md" onClick={onClose} aria-label="Cerrar">
            ×
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Sección 1: Contratante */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">1. Datos del Contratante</h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Nombre *"
                value={clienteForm.nombre}
                onChange={(e) => setClienteCampo('nombre', e.target.value)}
                required
                error={!clienteForm.nombre.trim() ? 'El nombre es obligatorio' : undefined}
              />
              <InputField label="Documento" value={clienteForm.documento} onChange={(e) => setClienteCampo('documento', e.target.value)} />
              <InputField label="Teléfono" value={clienteForm.telefono} onChange={(e) => setClienteCampo('telefono', e.target.value)} />
              <InputField label="Email" value={clienteForm.email} onChange={(e) => setClienteCampo('email', e.target.value)} />
              <InputField label="Domicilio" value={clienteForm.domicilio} onChange={(e) => setClienteCampo('domicilio', e.target.value)} className="col-span-2" />
            </div>
          </section>

          {/* Sección 2: Plazos */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">2. Plazos y Garantía</h3>
            <div className="grid grid-cols-3 gap-4">
              <InputField label="Plazo de ejecución" value={form.plazoEjecucionTexto} onChange={(e) => setForm({ ...form, plazoEjecucionTexto: e.target.value })} />
              <InputField label="Días de holgura" value={form.holguraDias} onChange={(e) => setForm({ ...form, holguraDias: e.target.value })} type="number" />
              <InputField label="Garantía (años)" value={form.garantiaAnios.toString()} onChange={(e) => setForm({ ...form, garantiaAnios: parseInt(e.target.value) || 2 })} type="number" />
            </div>
          </section>

          {/* Sección 3: Especificaciones — solo mostrar secciones con items cotizados.
              t-166: el gate pasa a `seccionesVisibles` (derivado una sola vez) en vez de
              llamar a `tieneItemsDeLaCategoria` en cada render. */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">3. Especificaciones Técnicas</h3>
            <div className="space-y-3">
              {seccionesVisibles.includes('Estructura') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Estructura</label>
                  <textarea
                    value={form.especificaciones.Estructura}
                    onChange={(e) => setForm({ ...form, especificaciones: { ...form.especificaciones, Estructura: e.target.value } })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Estructura en roble macizo 18mm, uniones con espiga..."
                  />
                </div>
              )}
              {seccionesVisibles.includes('Herrajes') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Herrajes</label>
                  <textarea
                    value={form.especificaciones.Herrajes}
                    onChange={(e) => setForm({ ...form, especificaciones: { ...form.especificaciones, Herrajes: e.target.value } })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Bisagras Blum de cierre suave..."
                  />
                </div>
              )}
              {seccionesVisibles.includes('Mesones') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Mesones</label>
                  <textarea
                    value={form.especificaciones.Mesones}
                    onChange={(e) => setForm({ ...form, especificaciones: { ...form.especificaciones, Mesones: e.target.value } })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Mesón en granito negro absoluto..."
                  />
                </div>
              )}
              {seccionesVisibles.includes('Desmonte') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Desmonte</label>
                  <textarea
                    value={form.especificaciones.Desmonte}
                    onChange={(e) => setForm({ ...form, especificaciones: { ...form.especificaciones, Desmonte: e.target.value } })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Condiciones de desmonte si aplica"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Sección 4: Objeto */}
          <section className="border-b border-border-subtle pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-heading">4. Objeto del Contrato</h3>
              {/* t-166: el objeto se deriva de los ítems al abrir el modal, pero después queda
                  congelado. Si el usuario edita la lista de ítems, recompilar es decisión suya. */}
              <Button variant="ghost" size="sm" onClick={recompilarDesdeItems}>
                Recompilar desde los ítems
              </Button>
            </div>
            <textarea
              value={form.objetoItems}
              onChange={(e) => setForm({ ...form, objetoItems: e.target.value })}
              className="w-full min-h-[100px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
              placeholder="Descripción de los espacios y elementos incluidos"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Una línea por ítem cotizado, con marca, acabado y ficha técnica. Recompilar descarta
              las ediciones manuales de este texto.
            </p>
          </section>

          {/* Sección 5: Valor y Hitos */}
          <section>
            <h3 className="text-sm font-semibold text-text-heading mb-3">5. Valor y Plan de Pagos</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-muted mb-1 block">Valor Total (COP)</label>
                <MoneyInput
                  value={form.valorTotal}
                  onChange={(v) => setForm({ ...form, valorTotal: v })}
                  className="w-full"
                />
              </div>

              {/* Hitos */}
              <div className="border border-border-subtle rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-heading">Hitos de Pago</span>
                  <Button variant="ghost" size="md" onClick={addHito}>
                    + Añadir hito
                  </Button>
                </div>
                <div className="space-y-2">
                  {hitos.map((hito, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-border-subtle rounded-md">
                      <span className="font-mono text-sm w-6">{hito.orden}.</span>
                      <select
                        value={hito.tipo}
                        onChange={(e) => handleHitoChange(index, 'tipo', e.target.value)}
                        className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-sm"
                      >
                        <option value="percentage">% del total</option>
                        <option value="fixed">Monto fijo</option>
                      </select>
                      <input
                        type="number"
                        value={hito.montoOPorcentaje}
                        onChange={(e) => handleHitoChange(index, 'montoOPorcentaje', e.target.value)}
                        className="w-24 rounded border border-border-subtle bg-bg-paper px-2 py-1 text-sm font-mono"
                        step={0.01}
                        min={0}
                      />
                      <input
                        type="text"
                        value={hito.razon}
                        onChange={(e) => handleHitoChange(index, 'razon', e.target.value)}
                        placeholder="Razón"
                        className="flex-1 rounded border border-border-subtle bg-bg-paper px-2 py-1 text-sm"
                      />
                      <Button variant="ghost" size="md" onClick={() => removeHito(index)} aria-label="Eliminar hito" className="text-text-muted hover:text-red-500">
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                {!hitosValidos && todosPorcentaje && (
                  <p className="text-xs text-error-text mt-2">
                    La suma de hitos por porcentaje debe ser 100%
                  </p>
                )}
                {todosPorcentaje && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Suma de hitos</span>
                      <span className="font-mono text-text-heading">{sumaHitos.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-bg-alt rounded-full h-1 mt-1">
                      <div
                        className="bg-brand h-1 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(sumaHitos, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted mt-2">
                      El último hito por porcentaje se autocálcula para cerrar la suma a 100%.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle">
          {/* t-166: antes un fallo de escritura (típicamente el 23505 del UNIQUE) no se veía
              en ninguna parte — `handleSave` no tenía try/catch, así que el modal se quedaba
              abierto sin explicar nada. Ahora el error se muestra y el modal sigue editable. */}
          {errorGuardado && (
            <p role="alert" className="mb-3 rounded-sm border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
              {errorGuardado}
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="md" onClick={onClose} disabled={guardandoContrato}>
              Cancelar
            </Button>
            <Button variant="secondary" size="md" onClick={handleGuardarBorrador} disabled={!esValido || guardandoContrato} loading={guardandoContrato}>
              {esEdicion ? 'Guardar cambios' : 'Guardar Borrador'}
            </Button>
            <Button variant="primary" size="md" onClick={handleGenerar} disabled={!esValido || guardandoContrato} loading={guardandoContrato}>
              {esEdicion ? 'Guardar y ver contrato' : 'Generar Contrato'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
