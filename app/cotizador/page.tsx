"use client";

import { useState } from "react";
import { Button } from "@/components/veta/button";
import { Badge } from "@/components/veta/badge";
import { Stepper } from "@/components/veta/stepper";
import { StatCard } from "@/components/veta/stat-card";
import { Modal } from "@/components/veta/modal";
import { InputField } from "@/components/veta/input-field";

/* P-04 · Cotizador ERP (PoC D4). Valida: kanban de estados (#32),
   stepper de etapas (#33), StatCard (#14 var.), tokens de estado semánticos. */
export default function CotizadorPage() {
  const [modalItem, setModalItem] = useState<
    { n: string; palo: string; cliente: string } | undefined
  >(undefined);

  const etapas = [
    { id: "brief", label: "Brief", state: "done" as const },
    { id: "diseno", label: "Diseño y cotización", state: "done" as const },
    { id: "aprobacion", label: "Aprobación del cliente", state: "active" as const },
    { id: "fabrica", label: "Fabricación", state: "pending" as const },
    { id: "entrega", label: "Entrega e instalación", state: "pending" as const },
  ];

  const columnas = [
    {
      titulo: "Cotizado",
      tonalidad: "neutral" as const,
      items: [{ n: "#1042", palo: "Roble", estado: "Pendiente de aprobar" as const, cliente: "Casa Río" }],
    },
    {
      titulo: "Aprobado",
      tonalidad: "info" as const,
      items: [{ n: "#1038", palo: "Nogal", estado: "En talla" as const, cliente: "Oficina Llanos" }],
    },
    {
      titulo: "En producción",
      tonalidad: "danger" as const,
      items: [{ n: "#1029", palo: "Cedro", estado: "Retraso en barniz" as const, cliente: "Cocina Márquez" }],
    },
    {
      titulo: "Entregado",
      tonalidad: "neutral" as const,
      items: [{ n: "#1017", palo: "Pino", estado: "Instalado" as const, cliente: "Vivienda Gómez" }],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">
            Cotizador
          </h1>
          <p className="text-sm text-text-muted">Comercial · Panel de cotizaciones activas</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Filtros</Button>
          <Button>+ Nueva cotización</Button>
        </div>
      </header>

      {/* KPIs - StatCard */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="En aprobación" value="7" unit="cotizaciones" tone="brand" />
        <StatCard label="Aprobadas este mes" value="12" unit="citas" />
        <StatCard label="En retraso" value="2" unit="órdenes" tone="danger" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[300px_1fr]">
        {/* Stepper de etapas */}
        <aside>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Etapa del proceso
          </h2>
          <div className="mt-4">
            <Stepper steps={etapas} />
          </div>
        </aside>

        {/* Kanban de cotizaciones */}
        <section>
          <div className="ml-auto grid max-w-none gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {columnas.map((col) => (
              <div
                key={col.titulo}
                className="rounded-md border border-border-subtle bg-bg-alt p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-text-heading">{col.titulo}</span>
                  <span className="rounded-full bg-bg-raised px-2 text-xs text-text-muted">
                    {col.items.length}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {col.items.map((c) => (
                    <li
                      key={c.n}
                      className="rounded-md border border-border-subtle bg-bg-raised p-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-heading">{c.n}</span>
                        <Badge tone={col.tonalidad} dot>
                          {c.palo}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-text-muted">{c.estado}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="md"
                          aria-label={`Detalle ${c.n}`}
                          onClick={() => setModalItem({ n: c.n, palo: c.palo, cliente: c.cliente })}
                        >
                          Detalle
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
      </div>
      </section>

      <Modal
        open={!!modalItem}
        onClose={() => setModalItem(undefined)}
        title={modalItem ? `Detalle ${modalItem.n}` : "Detalle"}
      >
        {modalItem && (
          <div className="flex flex-col gap-4">
            <InputField
              label="Número de proyecto"
              value={modalItem.n}
              readOnly
              aria-label="Número de proyecto"
            />
            <InputField label="Palo" value={modalItem.palo} readOnly />
            <InputField
              label="Cliente"
              defaultValue={modalItem.cliente}
              aria-label="Nombre del cliente"
            />
            <div className="mt-2 flex justify-end gap-3">
              <Button variant="secondary" size="md" onClick={() => setModalItem(undefined)}>
                Cancelar
              </Button>
              <Button size="md">Guardar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </div>
  );
}