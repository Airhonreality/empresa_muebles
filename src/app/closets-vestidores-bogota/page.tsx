import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata-helpers';
import SpaceShowcasePage from '@/components/specialized/spaces/SpaceShowcasePage';
import type { SeoImageData, TestimonialItem } from '@/types/space-showcase';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Closets y Vestidores Bogotá | Diseño a Medida Premium',
    description:
      'Closets y vestidores personalizados en Bogotá. Optimizamos tu espacio con diseño 3D, materiales premium y precisión de fábrica. Consulta gratis con nuestro equipo.',
    ogImage: '/vetadeoro/vetadeoro-closets-vestidor-espacioso-img-1.jpg',
    canonical: 'https://vetadeoro.co/closets-vestidores-bogota',
  });
}

const closetsImages: SeoImageData[] = [
  {
    imagen_filename: 'closet-vestidor-amplio-1.jpg',
    imagen_url: '/vetadeoro/vetadeoro-closets-vestidor-espacioso-img-1.jpg',
    alt_text:
      'Vestidor amplio y organizado con iluminación en Bogotá, proyecto de diseño Veta Dorada',
    image_title: 'Vestidor Amplio y Organizado - Bogotá | Veta Dorada',
    keywords: [
      'closet bogotá',
      'vestidor diseño',
      'muebles vestidor',
      'organización ropa',
      'carpintería bogotá',
    ],
    descripcion:
      'Vestidor amplio con sistemas de organización eficientes y acabados elegantes. Diseñado para maximizar espacio y facilitar tu rutina diaria.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Vestidor Amplio y Organizado',
    },
  },
  {
    imagen_filename: 'closet-modular-2.jpg',
    imagen_url: '/vetadeoro/vetadeoro-closets-closet-modular-img-2.jpg',
    alt_text: 'Closet modular con barras de colgar y estantes en Bogotá, fabricación Veta Dorada',
    image_title: 'Closet Modular Eficiente - Bogotá | Veta Dorada',
    keywords: [
      'closet modular',
      'barras de colgar',
      'organización armario',
      'diseño bogotá',
      'muebles medida',
    ],
    descripcion:
      'Sistema modular de closet con barras, estantes y divisiones adaptados a tu cantidad de prendas. Solución práctica y personalizable.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Closet Modular Eficiente',
    },
  },
  {
    imagen_filename: 'closet-puertas-correderas-3.jpg',
    imagen_url: '/vetadeoro/vetadeoro-closets-puertas-correderas-img-3.jpg',
    alt_text:
      'Closet con puertas correderas que optimiza espacio en Bogotá, proyecto Veta Dorada',
    image_title: 'Closet con Puertas Correderas - Bogotá | Veta Dorada',
    keywords: [
      'puertas correderas',
      'closet espacio',
      'diseño minimalista',
      'muebles bogotá',
      'optimización espacial',
    ],
    descripcion:
      'Closet inteligente con puertas correderas que no toman espacio al abrir. Diseño que maximiza el área útil de tu dormitorio.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Closet con Puertas Correderas',
    },
  },
];

const testimoniosDemo: TestimonialItem[] = [
  {
    nombre_cliente: 'Cliente Closet Usaquén',
    barrio: 'Usaquén',
    texto_resena:
      'Finalmente encontramos la solución que buscábamos. El closet es perfecto y muy funcional.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Closet Usaquén',
  },
  {
    nombre_cliente: 'Cliente Chicó',
    barrio: 'Chicó',
    texto_resena:
      'Excelente el proceso desde diseño hasta instalación. El equipo fue muy profesional.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Closet Chicó',
  },
];

export default function ClosetsPage() {
  return (
    <SpaceShowcasePage
      categoryId="closets"
      title="Closets que se adaptan a tu forma de vestir"
      subtitle="Vestidores y closets a medida"
      description="Diseñamos closets y vestidores que organizan tu ropa y accesorios según tu ritmo. Cada proyecto es una conversación sobre cómo usas tu armario."
      descriptionExtended="Un buen closet no es solo bonito, es funcional. Diseñamos sistemas de organización que crecen con tus necesidades: barras para colgar, estantes para doblado, divisiones para accesorios. Cada detalle se piensa en 3D antes de fabricar. Luego nuestro equipo instala con cuidado, garantizando que cada componente encaje perfectamente en tu espacio."
      images={closetsImages}
      benefits={[
        'Sistemas de organización pensados para tu cantidad de prendas y accesorios.',
        'Soluciones de iluminación integrada para localizar prendas fácilmente.',
        'Puertas y sistemas de apertura adaptados al espacio disponible.',
        'Acabados en maderas, lacas y materiales premium según tu preferencia.',
      ]}
      testimonials={testimoniosDemo}
      ctaConfig={{
        whatsappLink:
          'https://wa.me/573017604530?text=Hola+Veta+Dorada+Me+interesa+diseñar+mi+closet',
        calendarLink: 'https://calendly.com/vetadeoro/consulta-inicial',
        primaryLabel: 'Consultar disponibilidad',
        secondaryLabel: 'Agendar visita',
      }}
      processNote="Fabricamos en nuestro taller con sistemas de precisión y coordinamos la instalación en tu espacio, con revisión final de funcionamiento."
      socialProofStats={{
        projectsCompleted: 350,
        clientsSatisfied: 280,
        yearsExperience: 15,
      }}
    />
  );
}
