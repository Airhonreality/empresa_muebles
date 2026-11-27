import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de privacidad — Veta Dorada',
  description: 'Cómo Hermanos García González S.A.S (Veta Dorada) recolecta, usa y protege los datos personales que nos envías por nuestros formularios y canales de contacto.',
  alternates: { canonical: '/politica-de-privacidad' },
};

export default function PoliticaPrivacidadPage() {
  return (
    <>
      <section className="bg-bg-alt py-16 md:py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl md:text-5xl font-serif text-text-heading mb-4 tracking-tight">
            Política de privacidad
          </h1>
          <p className="text-text-muted">Última actualización: 27 de noviembre de 2026</p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-bg-paper">
        <div className="mx-auto max-w-3xl px-6 space-y-10 text-text-body leading-relaxed">
          <div>
            <h2 className="text-2xl font-serif text-text-heading mb-3">1. Responsable del tratamiento</h2>
            <p>
              Hermanos García González S.A.S, que opera la marca Veta Dorada (Bogotá, Colombia), es responsable del tratamiento de los datos personales que recibimos a través de este sitio.
            </p>
            <p className="mt-3">
              Contacto: WhatsApp y teléfono <a className="underline" href="tel:+573025922101">+57 302 592 2101</a>.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-serif text-text-heading mb-3">2. Datos que recolectamos</h2>
            <p>Solo pedimos los datos necesarios para responder tu solicitud:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>Nombre (opcional en algunos formularios).</li>
              <li>Teléfono o WhatsApp y, si lo indicas, correo electrónico.</li>
              <li>Ciudad del proyecto y tipo de espacio que quieres diseñar o cotizar.</li>
              <li>Los mensajes que nos envías por WhatsApp o por los formularios del sitio.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-serif text-text-heading mb-3">3. Para qué usamos tus datos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Contactarte para atender tu solicitud, agendar una visita o enviarte una cotización.</li>
              <li>Hacer seguimiento de tu proyecto mientras dure la negociación.</li>
              <li>Medir de forma agregada qué canales nos traen consultas, para mejorar el sitio y la publicidad.</li>
            </ul>
            <p className="mt-3">
              No vendemos tus datos ni los compartimos con terceros para fines publicitarios ajenos a Veta Dorada.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-serif text-text-heading mb-3">4. Cómo protegemos tus datos</h2>
            <p>
              Guardamos la información en sistemas con acceso restringido al equipo de Veta Dorada. Usamos conexiones cifradas para transmitir los datos.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-serif text-text-heading mb-3">5. Cuánto tiempo los conservamos</h2>
            <p>
              Conservamos los datos mientras sean necesarios para atender tu solicitud y, si se convierte en un proyecto, durante la relación comercial y la garantía. Después los eliminamos o anonimizamos.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-serif text-text-heading mb-3">6. Tus derechos</h2>
            <p>
              De acuerdo con la Ley 1581 de 2012 de Colombia, puedes conocer, actualizar, rectificar y suprimir tus datos personales, y revocar la autorización para su tratamiento. Para ejercer estos derechos escríbenos por WhatsApp o llama al <a className="underline" href="tel:+573025922101">+57 302 592 2101</a>.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-serif text-text-heading mb-3">7. Cambios en esta política</h2>
            <p>
              Si cambiamos esta política, publicaremos la versión nueva en esta página con la fecha de actualización.
            </p>
          </div>

          <p className="pt-6 border-t border-border-subtle text-sm text-text-muted">
            Volver al <Link className="underline" href="/">inicio</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
