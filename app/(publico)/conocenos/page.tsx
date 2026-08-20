import { Metadata } from 'next';
import Link from 'next/link';
import { AsesoriaBoton } from '@/components/veta/asesoria-boton';
import { obtenerPrecioAsesoria3dAction } from '@/lib/data/actions/public';

export const metadata: Metadata = {
  title: 'Conócenos — Veta Dorada, carpintería arquitectónica en Bogotá',
  description: 'Conoce a Veta Dorada: tres generaciones de oficio en la construcción y un estudio de diseño en Bogotá. Hugo García (obra) y Airhon J. García (diseño), sin intermediarios.',
};

export default async function ConocenosPage() {
  const precio3d = (await obtenerPrecioAsesoria3dAction()) || 130000;
  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio3d || 130000);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Veta Dorada",
            "founder": [
              {
                "@type": "Person",
                "name": "Hugo García",
                "jobTitle": "Maestro de obra y gestor de proyectos"
              },
              {
                "@type": "Person",
                "name": "Airhon J. García",
                "jobTitle": "Diseñador industrial"
              }
            ],
            "foundingDate": "2019",
            "legalName": "HERMANOS GARCIA GONZALEZ SAS"
          })
        }}
      />

      {/* Hero */}
      <section className="bg-bg-alt py-16 md:py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-text-heading mb-8 tracking-tight">
            Tres generaciones construyendo.<br />Un estudio diseñando.
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/portafolio" className="px-6 py-3 border border-border-subtle bg-bg-raised hover:bg-bg-alt text-text-heading font-medium rounded-sm transition-colors w-full sm:w-auto">
              Conozca nuestro trabajo
            </Link>
            <AsesoriaBoton precio3dFormatted={formattedPrice}>
              Agende su asesoría
            </AsesoriaBoton>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-16 md:py-24 bg-bg-paper">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-serif text-text-heading mb-8">Del ladrillo al diseño</h2>
          <div className="space-y-6 text-lg text-text-primary leading-relaxed">
            <p>
              El padre de Víctor fabricaba ladrillos. Ese oficio, el ladrillo, es el origen de la tradición familiar que hoy llega hasta el taller de Veta Dorada.
            </p>
            <p>
              Hugo y sus hermanos se dedicaron a la construcción y la remodelación de casas y espacios. De esas décadas en obra nace el oficio que hoy sostiene el taller.
            </p>
            <p>
              En 2014 se constituye formalmente la sociedad HERMANOS GARCIA GONZALEZ S.A.S. En 2019 nace Veta Dorada: un estudio que integra diseño, manufactura e instalación en un solo servicio, sin intermediarios y con la obra y el diseño en la misma mesa.
            </p>
          </div>
          <div className="mt-12 p-4 bg-bg-surface rounded-md border border-border-subtle text-sm text-text-muted">
            Veta Dorada es marca comercial registrada; la operación legal la representa HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9.
          </div>
        </div>
      </section>

      {/* Perfiles */}
      <section className="py-16 md:py-24 bg-bg-alt border-t border-border-subtle">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            <div className="flex flex-col gap-6">
              <div className="aspect-[4/3] bg-bg-alt rounded-md border border-border-subtle overflow-hidden flex items-center justify-center relative">
                {/* Fallback en caso de que no haya imagen real subida aún */}
                <div className="absolute inset-0 bg-bg-surface"></div>
                <span className="text-text-muted relative z-10 text-sm">Hugo García — Maestría en obra</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-heading mb-4">Hugo García — Maestría en obra</h3>
                <p className="text-text-primary leading-relaxed">
                  El oficio se hereda y se cultiva. Hugo creció entre ladrillos, mezclas y planos, en una familia dedicada a la construcción y la remodelación. De esas décadas en obra salen la sensibilidad para distribuir un espacio — que una cocina respire y un closet funcione — y el conocimiento técnico que pocos talleres tienen. Hugo gestiona obras de principio a fin y conoce a detalle la infraestructura: plomería, electricidad, gas, acabados y más.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="aspect-[4/3] bg-bg-alt rounded-md border border-border-subtle overflow-hidden flex items-center justify-center relative">
                {/* Fallback en caso de que no haya imagen real subida aún */}
                <div className="absolute inset-0 bg-bg-surface"></div>
                <span className="text-text-muted relative z-10 text-sm">Airhon J. García — Diseñador</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-heading mb-4">Airhon J. García — Diseñador</h3>
                <p className="text-text-primary leading-relaxed">
                  Su trabajo parte de una convicción: el buen vivir. Diseña espacios estéticos, confortables y eficientes, con una sensibilidad especial para el habitar — cómo se vive un espacio, cómo circula la luz, cómo respira una cocina. Su mirada del diseño une lo contemporáneo con el oficio del taller: cada proyecto responde a quien lo va a vivir.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-bg-paper border-t border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/portafolio" className="px-8 py-4 border border-border-subtle bg-bg-raised hover:bg-bg-alt text-text-heading font-medium rounded-sm transition-colors w-full sm:w-auto">
              Conozca nuestro trabajo
            </Link>
            <AsesoriaBoton precio3dFormatted={formattedPrice}>
              Agende su asesoría
            </AsesoriaBoton>
          </div>
        </div>
      </section>
    </>
  );
}
