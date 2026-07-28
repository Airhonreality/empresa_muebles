import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import VetaFooter from './VetaFooter';
import VetaHeader from './VetaHeader';

const steps = [
  ['01', 'Cuéntanos tu proyecto', 'Conocemos el espacio, tus necesidades de uso, medidas y referencias estéticas.'],
  ['02', 'Diseñamos la propuesta', 'Traducimos la conversación en una solución visual y técnica que puedas revisar.'],
  ['03', 'Definimos materiales', 'Acordamos acabados, herrajes, distribución y los detalles que hacen funcional el mueble.'],
  ['04', 'Fabricamos e instalamos', 'Coordinamos la producción en taller y la instalación final en tu espacio.'],
];

export default function VetaProceso() {
  return (
    <div className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]">
      <VetaHeader />
      <main>
        <section className="px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[hsl(var(--veta-text-stone))]">Así trabajamos</p>
            <h1 className="veta-heading mt-5 text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">Del primer encuentro a un espacio que se siente tuyo.</h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-[hsl(var(--veta-text-stone))] sm:text-lg">En Veta Dorada acompañamos el proyecto completo: diseño, fabricación e instalación de muebles a medida para espacios residenciales y comerciales en Bogotá.</p>
          </div>
        </section>
        <section className="px-4 pb-20 sm:px-6 lg:pb-28">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
            {steps.map(([number, title, copy]) => (
              <article key={number} className="veta-surface-matte rounded-[1.75rem] p-7 sm:p-9">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--veta-gold-muted))] text-xs font-bold">{number}</span>
                <h2 className="veta-heading mt-6 text-2xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">{copy}</p>
                <Check className="mt-7 h-5 w-5 text-[hsl(var(--veta-gold-hover))]" />
              </article>
            ))}
          </div>
          <div className="mx-auto mt-12 flex max-w-7xl flex-col items-start justify-between gap-5 rounded-[1.75rem] bg-[hsl(var(--veta-text-carbon))] p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div><h2 className="veta-heading text-2xl font-semibold">¿Tienes un espacio en mente?</h2><p className="mt-2 text-sm text-white/65">Cuéntanos lo esencial y prepararemos la conversación.</p></div>
            <Link href="/agendar" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#0A0A0A]">Agendar visita <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <VetaFooter />
    </div>
  );
}
