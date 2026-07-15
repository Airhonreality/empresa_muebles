import { Calendar, MapPin, ShieldCheck } from 'lucide-react';
import PublicLeadForm from './PublicLeadForm';
import { PublicSiteFooter, PublicSiteHeader } from './PublicSiteChrome';

export default function PublicAppointment() {
  return <div className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]"><PublicSiteHeader /><main className="veta-section px-6"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr]"><section><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--veta-gold-hover))]"><Calendar className="h-4 w-4" /> Agenda asistida</p><h1 className="veta-heading mt-4 text-4xl font-semibold tracking-tight">Diseñemos tu espacio.</h1><p className="mt-4 text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">Cuéntanos lo esencial y continuamos la conversación por WhatsApp.</p><div className="mt-8 space-y-4 text-sm text-[hsl(var(--veta-text-stone))]"><p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0" /> Cobertura operativa en Bogotá.</p><p className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0" /> Tus datos solo se usan para responder esta solicitud.</p></div></section><section className="veta-surface-glass rounded-[2rem] p-6 md:p-8"><PublicLeadForm /></section></div></main><PublicSiteFooter /></div>;
}
