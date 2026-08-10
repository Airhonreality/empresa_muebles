"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/veta/button";

export default function FinanzasPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-heading">
          Módulo de Finanzas
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Gestión de parámetros y tarifas para cálculos de costos
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border-subtle rounded-lg bg-bg-alt/60 p-6 hover:border-gold-400 transition-colors duration-soft">
          <h2 className="text-lg font-semibold text-text-heading mb-2">
            Parámetros de Costos
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Configurar tarifas por rol, arriendo de taller y días hábiles para cálculos de costos por tiempo.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/erp/finanzas/parametros")}
          >
            Ir a Parámetros
          </Button>
        </div>

        <div className="border border-border-subtle rounded-lg bg-bg-alt/60 p-6 opacity-50">
          <h2 className="text-lg font-semibold text-text-heading mb-2">
            Reportes Financieros
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Próximamente: Reportes de costos, rentabilidad y proyecciones.
          </p>
          <Button variant="ghost" disabled>
            Próximamente
          </Button>
        </div>
      </div>
    </div>
  );
}
