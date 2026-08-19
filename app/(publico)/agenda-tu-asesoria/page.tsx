import { Metadata } from 'next';
import { obtenerPrecioAsesoria3dAction } from '@/lib/data/actions/public';
import { MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agenda tu asesoría de diseño en Bogotá — Veta Dorada',
  description: 'Agenda tu asesoría de diseño en Bogotá. Visita a domicilio, medición, asesoría de materiales y cotización preliminar. Asesoría con diseño 3D disponible.',
};

export default async function AgendaTuAsesoriaPage() {
  const precio3d = await obtenerPrecioAsesoria3dAction();
  
  const formattedPrice = precio3d !== null 
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio3d)
    : 'Pendiente de tarifa';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Asesoría de diseño",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Veta Dorada"
            }
          })
        }}
      />

      {/* Hero */}
      <section className="bg-bg-alt py-16 md:py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-text-heading mb-6 tracking-tight">
            Tu espacio merece una mirada experta
          </h1>
          <p className="text-lg text-text-primary mb-10">
            Agenda tu asesoría de diseño. Un diseñador visita tu espacio, lo mide y conversa contigo sobre materiales y necesidades — sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded-sm transition-colors w-full sm:w-auto"
              aria-label="Abrir modal para agendar asesoría gratuita"
            >
              Quiero agendar mi asesoría gratuita
            </button>
            <button
              className="px-6 py-3 border border-border-subtle bg-bg-raised hover:bg-bg-alt text-text-heading font-medium rounded-sm transition-colors w-full sm:w-auto"
              aria-label="Abrir modal para agendar asesoría 3D"
            >
              Prefiero la asesoría con diseño 3D
            </button>
          </div>
        </div>
      </section>

      {/* ¿Cómo funciona? */}
      <section className="py-16 md:py-24 bg-bg-paper">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-serif text-text-heading mb-6">¿Cómo funciona una asesoría de diseño?</h2>
          <p className="text-lg text-text-primary">
            Un diseñador industrial visita tu espacio en Bogotá, toma medidas con precisión y conversa contigo sobre materiales, acabados y cómo vives. Con eso armamos una cotización preliminar, sin compromiso. Si quieres ver tu idea antes de decidir, el siguiente paso es el diseño 3D.
          </p>
        </div>
      </section>

      {/* Tabla / Cards de Precios */}
      <section className="py-16 bg-bg-surface border-y border-border-subtle">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="bg-bg-raised border border-border-subtle p-8 rounded-md shadow-sm flex flex-col">
              <h3 className="text-2xl font-bold text-text-heading mb-2">Asesoría Gratuita</h3>
              <p className="text-text-muted mb-6">Quien quiere una idea de precio y viabilidad sin compromiso</p>
              <div className="text-4xl font-bold text-text-heading mb-6">Gratis</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <span className="text-gold-600 font-bold">✓</span>
                  <span className="text-text-primary text-sm">Visita a domicilio (45-60 min)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-600 font-bold">✓</span>
                  <span className="text-text-primary text-sm">Medición del espacio</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-600 font-bold">✓</span>
                  <span className="text-text-primary text-sm">Asesoría de materiales y diseño</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-600 font-bold">✓</span>
                  <span className="text-text-primary text-sm">Cotización preliminar</span>
                </li>
              </ul>
              <button className="w-full py-3 border border-border-subtle bg-bg-alt hover:bg-bg-alt text-text-heading font-medium rounded-sm transition-colors">
                Agendar gratis
              </button>
            </div>

            <div className="bg-bg-raised border-2 border-gold-600 p-8 rounded-md shadow-md relative flex flex-col">
              <div className="absolute top-0 right-0 bg-gold-600 text-white text-xs font-bold px-3 py-1 rounded-bl-md rounded-tr-sm">Recomendada</div>
              <h3 className="text-2xl font-bold text-text-heading mb-2">Diseño 3D</h3>
              <p className="text-text-muted mb-6">Quien quiere ver su espacio renderizado antes de decidir</p>
              <div className="text-4xl font-bold text-text-heading mb-2">{formattedPrice}</div>
              <p className="text-sm text-gold-700 font-medium mb-6">Se deduce del anticipo al firmar contrato</p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <span className="text-gold-600 font-bold">✓</span>
                  <span className="text-text-primary text-sm">Todo lo de la asesoría gratuita (60-90 min)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-600 font-bold">✓</span>
                  <span className="text-text-primary text-sm">Modelo 3D fotorrealista de 2 espacios</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-600 font-bold">✓</span>
                  <span className="text-text-primary text-sm">Entrega en 3 a 5 días hábiles</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded-sm transition-colors">
                Agendar con diseño 3D
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Cobertura */}
      <section className="py-16 md:py-24 bg-bg-paper">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <MapPin className="mx-auto h-8 w-8 text-gold-600 mb-4" />
          <h2 className="text-3xl font-serif text-text-heading mb-6">¿Dónde nos visitas?</h2>
          <p className="text-lg text-text-primary mb-4">
            En Bogotá D.C. llegamos a todos los sectores, con la visita gratuita. También atendemos Chía, Cajicá y Cota, con un costo de desplazamiento adicional.
          </p>
          <p className="text-sm text-text-muted">
            Ejemplo: Atendimos a Mónica en Cajicá sin que tuviera que salir de casa.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-bg-alt border-t border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-serif text-text-heading mb-6">Agéndala hoy</h2>
          <p className="text-lg text-text-primary mb-10">
            Deja tus datos y un diseñador te contacta por WhatsApp en las próximas horas. Sin compromiso, sin letra pequeña.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-4 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded-sm transition-colors w-full sm:w-auto">
              Quiero agendar mi asesoría gratuita
            </button>
            <button className="px-8 py-4 border border-border-subtle bg-bg-raised hover:bg-bg-alt text-text-heading font-medium rounded-sm transition-colors w-full sm:w-auto">
              Prefiero la asesoría con diseño 3D
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
