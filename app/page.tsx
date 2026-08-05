import Link from "next/link";
import { Button } from "@/components/veta/button";

/* Hub de la PoC del Diamante 4 — enlaza las tres pantallas piloto. */
export default function Home() {
  const pantallas = [
    { href: "/landing", titulo: "F-01 · Landing", desc: "Público / marca" },
    { href: "/cotizador", titulo: "P-04 · Cotizador", desc: "ERP comercial" },
    { href: "/cronograma", titulo: "P-09 · Cronograma", desc: "ERP operativo" },
  ];
  return (
    <main className="flex flex-1 items-center justify-center bg-surface-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-wide text-gold-700">
          Veta Dorada Real · Diamante 4
        </p>
        <h1 className="mt-3 font-display text-display-publico font-semibold leading-tight text-text-display">
          Prueba de concepto
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-text-muted">
          Tres pantallas piloto que validan la implementabilidad del sistema visual
          canónico (tokens + primitivas) sobre Next 15 + React 19 + Tailwind v4.
        </p>
        <nav className="mt-10 flex flex-col gap-4 sm:flex-row">
          {pantallas.map((p) => (
            <Link key={p.href} href={p.href} className="flex-1">
              <Button variant="secondary" className="w-full">
                <span className="block">
                  <span className="block font-medium">{p.titulo}</span>
                  <span className="block text-xs font-normal text-text-muted">{p.desc}</span>
                </span>
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}