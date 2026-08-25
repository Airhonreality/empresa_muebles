import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Para arquitectos y diseñadores — fabricación a medida en Bogotá',
  description: 'Trabaje con quien fabrica: envíe planos (PDF/DWG/SketchUp) y reciba cotización detallada en 3-5 días hábiles. Manufactura e instalación de espacios en madera en Bogotá, sin intermediarios.',
};

export default function ParaArquitectosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Fabricación para Arquitectos y Diseñadores",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Veta Dorada"
            },
            "description": "Veta Dorada fabrica lo que usted diseña: cocinas, closets y espacios integrales en madera, con la obra y el diseño en la misma mesa."
          })
        }}
      />

      {/* Hero */}
      <section className="bg-bg-alt py-16 md:py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-text-heading mb-6 tracking-tight">
            Diseñe con quien fabrica.<br />Sin intermediarios.
          </h1>
          <p className="text-lg text-text-primary mb-10 max-w-3xl mx-auto">
            Veta Dorada fabrica lo que usted diseña: cocinas, closets y espacios integrales en madera, con la obra y el diseño en la misma mesa. Comunicación directa con el taller y cotización con plazo claro.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#cotizar" className="px-6 py-3 bg-text-heading hover:bg-black text-white font-medium rounded-sm transition-colors w-full sm:w-auto">
              Envíe su proyecto para cotizar
            </a>
            
          </div>
        </div>
      </section>

      {/* ¿Por qué trabajar con Veta Dorada? */}
      <section className="py-16 md:py-24 bg-bg-paper">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-bg-raised border border-border-subtle p-8 rounded-md shadow-sm">
              <div className="h-10 w-10 bg-bg-surface text-text-heading font-bold flex items-center justify-center rounded-sm mb-6">1</div>
              <h3 className="text-xl font-bold text-text-heading mb-3">Diseño + manufactura + instalación integrados</h3>
              <p className="text-text-primary text-sm">
                Su proyecto se fabrica y se instala en un solo flujo, sin sobrecostos de tercerización.
              </p>
            </div>
            <div className="bg-bg-raised border border-border-subtle p-8 rounded-md shadow-sm">
              <div className="h-10 w-10 bg-bg-surface text-text-heading font-bold flex items-center justify-center rounded-sm mb-6">2</div>
              <h3 className="text-xl font-bold text-text-heading mb-3">Comunicación directa con el taller</h3>
              <p className="text-text-primary text-sm">
                Un solo interlocutor, sin cadenas de intermediarios: sabe exactamente dónde y cómo se fabrica su proyecto.
              </p>
            </div>
            <div className="bg-bg-raised border border-border-subtle p-8 rounded-md shadow-sm">
              <div className="h-10 w-10 bg-bg-surface text-text-heading font-bold flex items-center justify-center rounded-sm mb-6">3</div>
              <h3 className="text-xl font-bold text-text-heading mb-3">Acabados corroborables en físico</h3>
              <p className="text-text-primary text-sm">
                Antes de fabricar, el acabado se verifica con la mano en el taller — el estándar de calidad que su cliente merece.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Canales de cotización & Proyectos para terceros */}
      <section className="py-16 bg-bg-surface border-t border-border-subtle">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-serif text-text-heading mb-6">Cómo cotizar para sus clientes</h2>
              <p className="text-text-primary mb-4">
                Recibimos planos (PDF, DWG, SketchUp) y devolvemos cotización detallada en 1 día hábil.
              </p>
              <p className="text-sm text-text-muted mb-4">
                Modelado BIM bajo acuerdo previo — se valida viabilidad técnica caso a caso. No se ofrece como estándar.
              </p>
              <p className="text-sm text-text-muted italic">
                * Condiciones para volumen recurrente (modelo white-label vs. co-branded): por definir con nuestro equipo en reunión.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-serif text-text-heading mb-6">Si usted diseña, nosotros fabricamos</h2>
              <p className="text-text-primary mb-4">
                Si usted diseña y nosotros fabricamos, su cliente recibe un solo servicio con su firma y nuestra manufactura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final (Contacto directo) */}
      <section id="cotizar" className="py-16 md:py-24 bg-bg-paper border-t border-border-subtle">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-serif text-text-heading mb-6">Envíe su proyecto para cotizar</h2>
          <p className="text-lg text-text-primary mb-10">
            Adjunte sus planos en PDF, DWG o SketchUp directo a nuestro WhatsApp corporativo y nuestro equipo revisará la viabilidad técnica para enviarle un presupuesto en 1 día hábil.
          </p>
          <a href="https://wa.me/573025922101?text=Hola,%20soy%20arquitecto/diseñador%20y%20me%20gustaría%20cotizar%20un%20proyecto" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded-sm transition-colors shadow-sm">
            Enviar planos por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
