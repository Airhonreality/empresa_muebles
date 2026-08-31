import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata-helpers';
import RecibidoresPage from '@/components/specialized/spaces/RecibidoresPage';
import type { SeoImageData, TestimonialItem } from '@/components/specialized/spaces/types';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Consolas y Recibidores Bogotá | Muebles de Entrada Premium',
    description:
      'Consolas y muebles de recibidor personalizados en Bogotá. Primeras impresiones memorables con diseño, almacenamiento y acabados premium.',
    ogImage: '/vetadeoro/vetadeoro-recibidor-consola-entrada-img-1.jpg',
    canonical: 'https://vetadeoro.co/consolas-recibidores',
  });
}

const recibitoresImages: SeoImageData[] = [
  {
    imagen_filename: 'consola-espejo-1.jpg',
    imagen_url: '/vetadeoro/vetadeoro-recibidor-consola-entrada-img-1.jpg',
    alt_text:
      'Consola de recibidor con espejo y almacenamiento en Bogotá, mueble diseño Veta Dorada',
    image_title: 'Consola de Recibidor con Espejo - Bogotá | Veta Dorada',
    keywords: [
      'consola recibidor',
      'mueble entrada',
      'consola espejo',
      'almacenamiento entrada',
      'diseño bogotá',
    ],
    descripcion:
      'Consola elegante para tu recibidor que combina funcionalidad y diseño. Espacio para llaves, sombreros y accesorios diarios con acabados sofisticados.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Consola de Recibidor con Espejo',
    },
  },
  {
    imagen_filename: 'mueble-entrada-modular-2.jpg',
    imagen_url: '/vetadeoro/vetadeoro-recibidor-mueble-entrada-img-2.jpg',
    alt_text:
      'Mueble modular de entrada con bancos en Bogotá, proyecto personalizado Veta Dorada',
    image_title: 'Mueble de Entrada Modular - Bogotá | Veta Dorada',
    keywords: [
      'mueble entrada',
      'banco recibidor',
      'almacenamiento modular',
      'mueble funcional',
      'diseño personalizacion',
    ],
    descripcion:
      'Sistema modular que integra consola, banco y almacenamiento. Diseñado para recibir visitantes con estilo y practicidad.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Mueble de Entrada Modular',
    },
  },
  {
    imagen_filename: 'zapatero-consola-3.jpg',
    imagen_url: '/vetadeoro/vetadeoro-recibidor-zapatero-consola-img-3.jpg',
    alt_text:
      'Zapatero consola integrado en recibidor de Bogotá, mueble práctico Veta Dorada',
    image_title: 'Zapatero Consola Integrado - Bogotá | Veta Dorada',
    keywords: [
      'zapatero consola',
      'almacenamiento zapatos',
      'mueble integral',
      'recibidor práctico',
      'muebles bogotá',
    ],
    descripcion:
      'Zapatero integrado con consola para el recibidor. Almacena zapatos organizadamente mientras mantiene la elegancia de la entrada.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Zapatero Consola Integrado',
    },
  },
];

const testimoniosDemo: TestimonialItem[] = [
  {
    nombre_cliente: 'Cliente Recibidor Chapinero',
    barrio: 'Chapinero',
    texto_resena:
      'La consola se convirtió en el punto focal del recibidor. Todos nuestros visitantes preguntan dónde la compramos.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Consola Chapinero',
  },
  {
    nombre_cliente: 'Cliente Entrada Mazurén',
    barrio: 'Mazurén',
    texto_resena:
      'Mueble funcional y hermoso. Ahora tenemos un lugar perfecto para llaves, sombreros y cosas de la calle.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Entrada Mazurén',
  },
];

export default function RecibidoresPageRoute() {
  return (
    <RecibidoresPage
      title="Consolas que cuentan historias desde la entrada"
      description="Diseñamos muebles de recibidor que hacen una primera impresión memorable. Funcionales, bellos, y perfectamente adaptados a tu espacio de entrada."
      descriptionExtended="El recibidor es lo primero que ve quien entra a tu casa. Merece un mueble que hable de tu gusto y que resuelva de forma elegante donde ponen las llaves, los sombreros, los zapatos mojados. Nuestros diseños de consolas y muebles de entrada combinan almacenamiento inteligente con acabados que enmarcan perfectamente tus espacios."
      images={recibitoresImages}
      benefits={[
        'Composición pensada para el espacio específico de tu entrada.',
        'Almacenamiento para llaves, sombreros, paraguas y objetos diarios.',
        'Integración de espejos y acabados que agrandan y mejoran la luz.',
        'Fabricación con materiales que resisten el paso y la humedad.',
      ]}
      testimonials={testimoniosDemo}
      ctaConfig={{
        whatsappLink:
          'https://wa.me/573017604530?text=Hola+Veta+Dorada+Me+interesa+diseñar+mi+recibidor',
        calendarLink: 'https://calendly.com/vetadeoro/consulta-inicial',
        primaryLabel: 'Consultar disponibilidad',
        secondaryLabel: 'Agendar visita',
      }}
      processNote="Diseñamos considerando flujo, iluminación y materiales durables. Luego fabricamos en nuestro taller e instalamos con precisión en tu entrada."
      socialProofStats={{
        projectsCompleted: 150,
        clientsSatisfied: 140,
        yearsExperience: 15,
      }}
    />
  );
}
