import { Badge } from "@/components/veta/badge";

/* P-09 · Cronograma doble operativo (PoC D4).
   Valida: timeline doble (#34), checklist de entrega E-21 (#35),
   tabla de caja (#14), tokens de warning/info semánticos. */
export default function CronogramaPage() {
  const lineas = [
    {
      semana: "S1",
      fechas: "03–07 mar",
      actividad: "Corte y canteado",
      encargado: "Taller · J. García",
      estado: "done" as const,
    },
    {
      semana: "S2",
      fechas: "10–14 mar",
      actividad: "Armado de caja",
      encargado: "Taller · H. García",
      estado: "done" as const,
    },
    {
      semana: "S3",
      fechas: "17–21 mar",
      actividad: "Barnizado y pulido",
      encargado: "Acabados · Equipo 2",
      estado: "active" as const,
    },
    {
      semana: "S4",
      fechas: "24–28 mar",
      actividad: "Empaque y entrega",
      encargado: "Logística · R. Gómez",
      estado: "pending" as const,
    },
  ];

  const checklist = [
    { item: "Cortes con tolerancia ±1mm", ok: true },
    { item: "Canteado en todas las aristas visibles", ok: true },
    { item: "Lijado fino calibre 220", ok: true },
    { item: "Prueba de herrajes antes de empaque", ok: false },
  ];

  const partidas = [
    { pieza: "Panel lateral", material: "Roble 18mm", unidad: "2", estado: "Ok" },
    { pieza: "Panel superior", material: "Roble 18mm", unidad: "1", estado: "Ok" },
    { pieza: "Puertas canteadas", material: "Roble 18mm", unidad: "2", estado: "En taller" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">
            Cronograma de producción
          </h1>
          <p className="text-sm text-text-muted">Operativo · Orden #1029 · Cedro</p>
        </div>
        <Badge tone="warning" dot>
          Retraso estimado 2 días
        </Badge>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Timeline doble */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Línea de tiempo
          </h2>
          <ol className="mt-6 flex flex-col gap-0">
            {lineas.map((l, i) => {
              const isLast = i === lineas.length - 1;
              return (
                <li key={l.semana} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <span
                      aria-hidden
                      className={`absolute left-[15px] top-6 h-[calc(100%-1.5rem)] w-px ${
                        l.estado === "done" ? "bg-gold-300" : "bg-border-subtle"
                      }`}
                    />
                  )}
                  <span
                    aria-hidden
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-medium ${
                      l.estado === "done"
                        ? "border-gold-600 bg-gold-600 text-white"
                        : l.estado === "active"
                          ? "border-gold-600 bg-gold-100 text-gold-700"
                          : "border-border-default bg-bg-raised text-text-muted"
                    }`}
                  >
                    {l.estado === "done" ? "✓" : l.estado === "active" ? l.semana : l.semana}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-text-heading">{l.actividad}</p>
                      <span className="font-mono text-xs text-text-muted">{l.fechas}</span>
                    </div>
                    <p className="text-sm text-text-muted">{l.encargado}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Checklist de entrega E-21 */}
        <section className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Checklist pre-entrega
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {checklist.map((c) => (
                <li
                  key={c.item}
                  className="flex items-start gap-3 rounded-md border border-border-subtle bg-bg-raised p-3"
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-xs font-bold ${
                      c.ok
                        ? "bg-gold-600 text-white"
                        : "border border-border-default bg-bg-raised text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={`text-sm ${
                      c.ok ? "text-text-primary" : "font-medium text-warning-text"
                    }`}
                  >
                    {c.item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tabla de caja */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Partidas de la caja
            </h2>
            <div className="mt-4 overflow-hidden rounded-md border border-border-subtle">
              <table className="w-full bg-bg-raised text-left text-sm">
                <thead className="bg-bg-alt text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Pieza</th>
                    <th className="px-4 py-3 font-semibold">Material</th>
                    <th className="px-4 py-3 text-right font-semibold">Und</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {partidas.map((p) => (
                    <tr key={p.pieza}>
                      <td className="px-4 py-3 font-medium text-text-heading">{p.pieza}</td>
                      <td className="px-4 py-3 text-text-muted">{p.material}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-muted">{p.unidad}</td>
                      <td className="px-4 py-3">
                        <Badge tone={p.estado === "Ok" ? "neutral" : "warning"} dot>
                          {p.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}