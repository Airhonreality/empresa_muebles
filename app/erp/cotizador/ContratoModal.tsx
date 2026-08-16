"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/veta/button";
import { InputField } from "@/components/veta/input-field";
import { MoneyInput } from "@/components/veta/money-input";
import { useDataStore, type Proyecto, type Cliente, type EspacioVariante, type ItemVariante, type ProductoCatalogo, type Contrato } from "@/lib/data";

export interface ContratoModalProps {
  proyecto: Proyecto;
  cliente: Cliente | undefined;
  espacios: EspacioVariante[];
  itemsPorEspacio: Map<string, ItemVariante[]>;
  catalogo: ProductoCatalogo[];
  manoDeObra: number;
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
  especificacionesEstructura: string;
  especificacionesHerrajes: string;
  especificacionesMesones: string;
  especificacionesDesmonte: string;
};

export function ContratoModal({ proyecto, cliente, espacios, itemsPorEspacio, catalogo, manoDeObra, onClose, onSaved }: ContratoModalProps) {
  const store = useDataStore();
  const productMap = useMemo(() => new Map(catalogo.map((p) => [p.id, p])), [catalogo]);

  // Estado del formulario
  const [form, setForm] = useState<FormContrato>({
    codigoContrato: `CTR-${new Date().getFullYear()}-${String(proyecto.id).slice(-4).toUpperCase()}`,
    fechaContrato: new Date().toISOString().slice(0, 10),
    valorTotal: calcularValorTotal(espacios, itemsPorEspacio, manoDeObra).toString(),
    plazoEjecucionTexto: proyecto.diasEntregaEstimados ? `${Math.floor(proyecto.diasEntregaEstimados / 7)} a ${Math.ceil(proyecto.diasEntregaEstimados / 7)}` : '4 a 5',
    holguraDias: '8',
    garantiaAnios: proyecto.garantiaAnios ?? 2,
    objetoItems: compilarObjetoItems(espacios, itemsPorEspacio, productMap),
    especificacionesEstructura: tieneItemsDeLaCategoria('Estructura') ? compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Estructura') : '',
    especificacionesHerrajes: tieneItemsDeLaCategoria('Herrajes') ? compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Herrajes') : '',
    especificacionesMesones: tieneItemsDeLaCategoria('Mesones') ? compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Mesones') : '',
    especificacionesDesmonte: tieneItemsDeLaCategoria('Desmonte') ? compilarEspecificaciones(espacios, itemsPorEspacio, productMap, 'Desmonte') : '',
  });

  // Hitos (default: 50/25/25)
  const [hitos, setHitos] = useState<HitoLocal[]>([
    { orden: 1, tipo: 'percentage', montoOPorcentaje: '50', razon: 'Anticipo al firmar contrato', fechaLimite: '' },
    { orden: 2, tipo: 'percentage', montoOPorcentaje: '25', razon: 'Al iniciar instalación', fechaLimite: '' },
    { orden: 3, tipo: 'percentage', montoOPorcentaje: '25', razon: 'Contra entrega y acta de satisfacción', fechaLimite: '' },
  ]);

  // Calcular valor total desde espacios/items
  const valorTotalCalculado = useMemo(() => calcularValorTotal(espacios, itemsPorEspacio, manoDeObra), [espacios, itemsPorEspacio, manoDeObra]);

  // Sincronizar valorTotal si cambia el cálculo
  useMemo(() => {
    if (form.valorTotal !== valorTotalCalculado.toString()) {
      setForm((prev) => ({ ...prev, valorTotal: valorTotalCalculado.toString() }));
    }
  }, [valorTotalCalculado, form.valorTotal]);

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

  // Compilar objeto de ítems
  function compilarObjetoItems(espacios: EspacioVariante[], itemsPorEspacio: Map<string, ItemVariante[]>, productMap: Map<string, ProductoCatalogo>): string {
    const lines: string[] = [];
    espacios.forEach((esp) => {
      const items = itemsPorEspacio.get(esp.id) ?? [];
      items.forEach((item) => {
        const prod = item.catalogoId ? productMap.get(item.catalogoId) : undefined;
        const desc = item.nombrePersonalizado ?? prod?.descripcion ?? 'Ítem sin catálogo';
        const cant = item.cantidad;
        const sku = prod?.sku ?? '';
        lines.push(`- ${desc}${sku ? ` (${sku})` : ''}: ${cant} ${prod?.unidadMedida ?? 'ud'}`);
      });
    });
    return lines.join('\n');
  }

  // Mapear categorias comerciales reales a las 4 secciones del contrato.
  // Solo Maderas→Estructura y Herrajes→Herrajes tienen una categoría real hoy en el catálogo.
  // "Mesones" (piedra/granito) y "Desmonte" (retiro de mobiliario existente) no tienen
  // categoriaComercial equivalente todavía — sus secciones quedan legítimamente vacías/ocultas
  // hasta que el catálogo tenga productos con esa categoría; NO se fuerza un mapeo falso
  // (ej. "Muebles"→Mesones o "Mano de Obra"→Desmonte serían semánticamente incorrectos).
  function mapearCategoriaASeccion(categoriaComercial: string | null): string | null {
    if (!categoriaComercial) return null;
    const mapa: Record<string, string> = {
      'Maderas': 'Estructura',
      'Herrajes': 'Herrajes',
    };
    return mapa[categoriaComercial] || null;
  }

  // Compilar especificaciones por tipo — solo incluye items si la categoría real del producto mapea a ese tipo
  function compilarEspecificaciones(espacios: EspacioVariante[], itemsPorEspacio: Map<string, ItemVariante[]>, productMap: Map<string, ProductoCatalogo>, tipo: string): string {
    const lines: string[] = [];

    espacios.forEach((esp) => {
      const items = itemsPorEspacio.get(esp.id) ?? [];
      items.forEach((item) => {
        const prod = item.catalogoId ? productMap.get(item.catalogoId) : undefined;
        if (prod && mapearCategoriaASeccion(prod.categoriaComercial) === tipo) {
          const desc = item.nombrePersonalizado ?? prod.descripcion;
          const cant = item.cantidad;
          lines.push(`- ${desc}: ${cant} ${prod.unidadMedida ?? 'ud'}`);
        }
      });
    });

    return lines.join('\n');
  }

  // Verificar si hay items de una categoría específica en las variantes activas/visibles
  function tieneItemsDeLaCategoria(tipo: string): boolean {
    for (const esp of espacios) {
      const items = itemsPorEspacio.get(esp.id) ?? [];
      for (const item of items) {
        const prod = item.catalogoId ? productMap.get(item.catalogoId) : undefined;
        if (prod && mapearCategoriaASeccion(prod.categoriaComercial) === tipo) {
          return true;
        }
      }
    }
    return false;
  }

  // Calcular valor total desde espacios e items
  // Incluye la mano de obra por_tiempo (tarifa horaria × jornadas) calculada
  // en el cotizador y arrastrada al contrato (POC-10#7).
  function calcularValorTotal(
    espacios: EspacioVariante[],
    itemsPorEspacio: Map<string, ItemVariante[]>,
    manoDeObra: number
  ): number {
    // Cálculo base: suma de ítems (módulos / materiales)
    const totalItems = Array.from(itemsPorEspacio.values()).reduce((sum, items) => {
      return sum + items.reduce((itemSum, item) => itemSum + (parseFloat(item.totalLinea ?? '0') || 0), 0);
    }, 0);

    // La mano de obra por tiempo (jornadas × tarifa horaria por rol) ya viene
    // consolidada desde el cotizador; se suma al valor contractual.
    return totalItems + manoDeObra;
  }

  // Guardar contrato
  const handleSave = useCallback(async () => {
    // Crear hitos
    const hitosData: { tipo: 'percentage' | 'fixed'; monto: string; razon: string }[] = hitos.map((h) => ({
      tipo: h.tipo,
      monto: h.montoOPorcentaje,
      razon: h.razon,
    }));

    // Guardar en store
    const contratoCreado = await store.contratos.crear({
      proyectoId: proyecto.id,
      codigoContrato: form.codigoContrato,
      valorTotal: form.valorTotal,
      hitos: hitosData,
    });

    if (contratoCreado) {
      onSaved(contratoCreado);
      onClose();
    }
  }, [form, hitos, proyecto.id, onSaved, onClose, store]);

  // Verificar si el formulario es válido
  const esValido = cliente && parseFloat(form.valorTotal) > 0 && hitosValidos && hitos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-lg border border-border-subtle bg-bg-raised shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 id="modal-title" className="text-lg font-semibold text-text-heading">
            Generar Contrato
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
                value={cliente?.nombre ?? ''}
                 onChange={() => {/* TODO: actualizar cliente */}}
                required
                error={!cliente?.nombre ? 'Seleccione un cliente' : undefined}
              />
              <InputField label="Documento" value={cliente?.documento ?? ''} readOnly />
              <InputField label="Teléfono" value={cliente?.telefono ?? ''} readOnly />
              <InputField label="Email" value={cliente?.email ?? ''} readOnly />
              <InputField label="Domicilio" value={cliente?.domicilio ?? ''} readOnly className="col-span-2" />
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

          {/* Sección 3: Especificaciones — solo mostrar secciones con items cotizados */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">3. Especificaciones Técnicas</h3>
            <div className="space-y-3">
              {tieneItemsDeLaCategoria('Estructura') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Estructura</label>
                  <textarea
                    value={form.especificacionesEstructura}
                    onChange={(e) => setForm({ ...form, especificacionesEstructura: e.target.value })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Estructura en roble macizo 18mm, uniones con espiga..."
                  />
                </div>
              )}
              {tieneItemsDeLaCategoria('Herrajes') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Herrajes</label>
                  <textarea
                    value={form.especificacionesHerrajes}
                    onChange={(e) => setForm({ ...form, especificacionesHerrajes: e.target.value })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Bisagras Blum de cierre suave..."
                  />
                </div>
              )}
              {tieneItemsDeLaCategoria('Mesones') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Mesones</label>
                  <textarea
                    value={form.especificacionesMesones}
                    onChange={(e) => setForm({ ...form, especificacionesMesones: e.target.value })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Ej: Mesón en granito negro absoluto..."
                  />
                </div>
              )}
              {tieneItemsDeLaCategoria('Desmonte') && (
                <div>
                  <label className="text-sm font-medium text-text-muted mb-1 block">Desmonte</label>
                  <textarea
                    value={form.especificacionesDesmonte}
                    onChange={(e) => setForm({ ...form, especificacionesDesmonte: e.target.value })}
                    className="w-full min-h-[80px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                    placeholder="Condiciones de desmonte si aplica"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Sección 4: Objeto */}
          <section className="border-b border-border-subtle pb-4">
            <h3 className="text-sm font-semibold text-text-heading mb-3">4. Objeto del Contrato</h3>
            <textarea
              value={form.objetoItems}
              onChange={(e) => setForm({ ...form, objetoItems: e.target.value })}
              className="w-full min-h-[100px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
              placeholder="Descripción de los espacios y elementos incluidos"
            />
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} disabled={!esValido}>
            Guardar Borrador
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            Generar Contrato
          </Button>
        </div>
      </div>
    </div>
  );
}
