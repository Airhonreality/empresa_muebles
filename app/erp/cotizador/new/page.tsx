"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/veta/button";
import { InputField } from "@/components/veta/input-field";
import { useDataStore, type Proyecto, type Cliente } from "@/lib/data";

export default function NuevoProyectoPage() {
  const router = useRouter();
  const store = useDataStore();

  const [nombreProyecto, setNombreProyecto] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [direccionObra, setDireccionObra] = useState("");
  const [descripcionSemantica, setDescripcionSemantica] = useState("");
  const [errores, setErrores] = useState<{
    nombreProyecto?: string;
  }>({});

  const clientes = store.clientes.listar();

  const handleSubmit = useCallback(async () => {
    const nuevosErrores: typeof errores = {};

    // Validar nombre proyecto (R1) — único campo obligatorio (2026-08-11, Javier: cliente/dirección se completan después)
    if (!nombreProyecto.trim()) {
      nuevosErrores.nombreProyecto = "El nombre del proyecto es obligatorio";
    }

    setErrores(nuevosErrores);

    // Detener si hay errores
    if (Object.keys(nuevosErrores).length > 0) return;

    const nuevoProyecto: Partial<Proyecto> & { nombreProyecto: string } = {
      nombreProyecto: nombreProyecto.trim(),
      clienteId: clienteSeleccionado?.id ?? null,
      tipoProyecto: 'personalizado',
      direccionObra: direccionObra.trim() || null,
      descripcionSemantica: descripcionSemantica.trim() || null,
      estado: 'activa',
      costosOperativos: '0',
      imprevistosInstalacion: '0',
      descuentoComercial: '0',
      ajusteArbitrario: '0',
      aplicaIva: false,
      porcentajeIva: '19',
      garantiaAnios: 2,
      diasEntregaEstimados: null,
    };

    const proyectoCreado = await store.proyectos.crear(nuevoProyecto);
    if (proyectoCreado) {
      router.push(`/erp/cotizador/${proyectoCreado.id}`);
    }
  }, [nombreProyecto, clienteSeleccionado, direccionObra, descripcionSemantica, router, store]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-heading">
          Nuevo Proyecto
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Crear un nuevo proyecto para cotización
        </p>
      </header>

      <div className="space-y-4">
        <div>
          <InputField
            label="Nombre del Proyecto *"
            value={nombreProyecto}
            onChange={(e) => {
              setNombreProyecto(e.target.value);
              if (errores.nombreProyecto) {
                setErrores((prev) => ({ ...prev, nombreProyecto: undefined }));
              }
            }}
            placeholder="Ej: Cocina Integral Roble"
            required
          />
          {errores.nombreProyecto && (
            <p className="mt-1 text-sm text-error">{errores.nombreProyecto}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Cliente
          </label>
          <HybridClientSelector
            clientes={clientes}
            valor={clienteSeleccionado}
            onSelect={setClienteSeleccionado}
          />
        </div>

        <div>
          <InputField
            label="Dirección de Obra"
            value={direccionObra}
            onChange={(e) => setDireccionObra(e.target.value)}
            placeholder="Ej: Cra 15 #123-45, Bogotá"
          />
        </div>

        <InputField
          label="Descripción Semántica"
          value={descripcionSemantica}
          onChange={(e) => setDescripcionSemantica(e.target.value)}
          placeholder="Ej: Cocina integral con isla central y muebles altos"
        />
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!nombreProyecto.trim()}
        >
          Crear Proyecto
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push('/erp/comercial')}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function HybridClientSelector({
  clientes,
  valor,
  onSelect,
}: {
  clientes: Cliente[]
  valor: Cliente | null
  onSelect: (cliente: Cliente) => void
}) {
  const store = useDataStore()
  const [abierto, setAbierto] = useState(false)
  const [query, setQuery] = useState(valor?.nombre ?? "")

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      (c.documento ?? "").toLowerCase().includes(q)
    )
  }, [clientes, query])

  const puedeCrear =
    query.trim().length > 0 &&
    !filtrados.some(c => c.nombre.toLowerCase() === query.trim().toLowerCase())

  const crearNuevo = useCallback(async () => {
    const nombre = query.trim()
    if (!nombre) return
    const nuevo = await store.clientes.crear({ nombre })
    onSelect(nuevo)
    setAbierto(false)
  }, [query, store, onSelect])

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setAbierto(true) }}
        onFocus={() => setAbierto(true)}
        onBlur={() => window.setTimeout(() => setAbierto(false), 120)}
        placeholder="Buscar o crear cliente..."
        className="w-full rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
      />
      {abierto && (
        <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded border border-border-subtle bg-bg-raised shadow-md">
          {filtrados.map(c => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-text-heading hover:bg-bg-alt"
                onMouseDown={(e) => { e.preventDefault(); onSelect(c); setQuery(c.nombre); setAbierto(false) }}
              >
                <span className="font-medium">{c.nombre}</span>
                {c.telefono && <span className="ml-2 text-xs text-text-muted">{c.telefono}</span>}
              </button>
            </li>
          ))}
          {puedeCrear && (
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-brand hover:bg-bg-alt"
                onMouseDown={(e) => { e.preventDefault(); crearNuevo() }}
              >
                + Crear cliente: {query.trim()}
              </button>
            </li>
          )}
          {filtrados.length === 0 && !puedeCrear && (
            <li className="px-3 py-2 text-xs text-text-muted">Sin clientes encontrados.</li>
          )}
        </ul>
      )}
    </div>
  )
}
