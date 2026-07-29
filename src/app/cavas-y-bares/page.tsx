import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata-helpers';
import SpaceShowcasePage from '@/components/specialized/spaces/SpaceShowcasePage';
import type { SeoImageData, TestimonialItem } from '@/types/space-showcase';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Cavas y Bares Bogotá | Muebles de Almacenamiento Premium',
    description:
      'Cavas y bares a medida en Bogotá. Muebles de exhibición y almacenamiento para botellas, cristalería y accesorios. Diseño, fabricación e instalación profesional.',
    ogImage: '/vetadeoro/vetadeoro-cavas-bares-cava-vinos-img-1.jpg',
    canonical: 'https://vetadeoro.co/cavas-y-bares',
  });
}

const cavasImages: SeoImageData[] = [
  {
    imagen_filename: 'cava-vinos-premium-1.jpg',
    imagen_url: '/vetadeoro/vetadeoro-cavas-bares-cava-vinos-img-1.jpg',
    alt_text:
      'Cava de vinos con almacenamiento y exhibición en Bogotá, mueble premium Veta Dorada',
    image_title: 'Cava de Vinos Premium - Bogotá | Veta Dorada',
    keywords: [
      'cava vinos',
      'mueble bar',
      'almacenamiento botellas',
      'diseño bogotá',
      'mueble premium',
    ],
    descripcion:
      'Cava de vinos diseñada para almacenar y exhibir tu colección. Espacio dedicado para botellas, copas y accesorios con acabados elegantes.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Cava de Vinos Premium',
    },
  },
  {
    imagen_filename: 'bar-modular-2.jpg',
    imagen_url: '/vetadeoro/vetadeoro-cavas-bares-bar-modular-img-2.jpg',
    alt_text:
      'Mueble bar modular con cristalería en Bogotá, fabricación personalizada Veta Dorada',
    image_title: 'Mueble Bar Modular - Bogotá | Veta Dorada',
    keywords: [
      'mueble bar',
      'bar integrado',
      'cristalería almacenamiento',
      'diseño hogar',
      'muebles bogotá',
    ],
    descripcion:
      'Módulo bar personalizado que integra almacenamiento de botellas, cristalería y accesorios en una solución coherente con tu espacio.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Mueble Bar Modular',
    },
  },
  {
    imagen_filename: 'exhibidor-botellas-3.jpg',
    imagen_url: '/vetadeoro/vetadeoro-cavas-bares-exhibidor-botellas-img-3.jpg',
    alt_text:
      'Exhibidor de botellas con iluminación en Bogotá, proyecto de diseño Veta Dorada',
    image_title: 'Exhibidor de Botellas con Iluminación - Bogotá | Veta Dorada',
    keywords: [
      'exhibidor botellas',
      'iluminación mueble',
      'almacenamiento categorizado',
      'mueble decorativo',
      'diseño interiores',
    ],
    descripcion:
      'Exhibidor de botellas con iluminación integrada que destaca tu colección y crea una atmósfera sofisticada en cualquier ambiente.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Exhibidor de Botellas con Iluminación',
    },
  },
];

const testimoniosDemo: TestimonialItem[] = [
  {
    nombre_cliente: 'Cliente Cava Usaquén',
    barrio: 'Usaquén',
    texto_resena:
      'La cava quedó espectacular. Exactamente lo que imaginábamos para compartir con amigos.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Cava Usaquén',
  },
  {
    nombre_cliente: 'Cliente Pereira Gzaviria',
    barrio: 'Pereira Gzaviria',
    texto_resena: 'Mueble de muy buena calidad. El detalle y acabado son excepcionales.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Bar Pereira Gzaviria',
  },
];

export default function CavasPage() {
  return (
    <SpaceShowcasePage
      categoryId="cavas"
      title="Cavas y bares que crean momentos"
      subtitle="Cavas y bares a medida"
      description="Diseñamos cavas y bares que integran almacenamiento, exhibición y una experiencia social dentro de tu casa o proyecto comercial."
      descriptionExtended="Un buen mueble bar va más allá de guardar botellas: es una invitación a compartir. Cada cava o bar que diseñamos piensa en cómo quieres que se sienta ese espacio, qué colección quieres exhibir y cómo el mueble se integra con el resto del ambiente. Nuestro equipo fabrica con acabados que mejoran con el tiempo."
      images={cavasImages}
      benefits={[
        'Composición a medida para el muro, rincón o ambiente disponible.',
        'Espacios específicos para botellas, cristalería, accesorios y apoyo.',
        'Iluminación integrada opcional para destacar tu colección.',
        'Materiales y acabados alineados con el carácter del ambiente.',
      ]}
      testimonials={testimoniosDemo}
      ctaConfig={{
        whatsappLink:
          'https://wa.me/573017604530?text=Hola+Veta+Dorada+Me+interesa+diseñar+mi+cava+o+bar',
        calendarLink: 'https://calendly.com/vetadeoro/consulta-inicial',
        primaryLabel: 'Consultar disponibilidad',
        secondaryLabel: 'Agendar visita',
      }}
      processNote="Fabricamos la composición definida en nuestro taller y coordinamos su instalación para que quede perfectamente integrada al ambiente."
      socialProofStats={{
        projectsCompleted: 200,
        clientsSatisfied: 185,
        yearsExperience: 15,
      }}
    />
  );
}
