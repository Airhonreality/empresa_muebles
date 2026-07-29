import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata-helpers';
import SpaceShowcasePage from '@/components/specialized/spaces/SpaceShowcasePage';
import type { SeoImageData, TestimonialItem } from '@/types/space-showcase';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Cocinas Integrales Bogotá | Diseño Premium a Medida',
    description:
      'Diseñamos, fabricamos e instalamos cocinas integrales personalizadas en Bogotá. Visualización 3D, materiales premium y precisión de fábrica. Agendar consulta gratis.',
    ogImage: '/vetadeoro/vetadeoro-cocinas-cocina-de-superficies-continuas-img-1.jpg',
    canonical: 'https://vetadeoro.co/cocinas-integrales-bogota',
  });
}

const cocinasImages: SeoImageData[] = [
  {
    imagen_filename: 'cocina-superficies-continuas-1.jpg',
    imagen_url: '/vetadeoro/vetadeoro-cocinas-cocina-de-superficies-continuas-img-1.jpg',
    alt_text:
      'Cocina integral moderna con superficies continuas y luz natural en Bogotá, proyecto Veta Dorada',
    image_title: 'Cocina Integral Moderna con Superficies Continuas - Bogotá | Veta Dorada',
    keywords: [
      'cocina integral',
      'muebles cocina',
      'diseño bogotá',
      'superficies continuas',
      'cocina premium',
    ],
    descripcion:
      'Cocina integral de diseño moderno con superficies continuas que optimizan cada centímetro del espacio. Fabricada en materiales premium con instalación profesional en Bogotá.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Cocina Integral Moderna con Superficies Continuas',
      description:
        'Cocina de precisión con gabinetes continuos, optimización espacial y acabados premium',
    },
  },
  {
    imagen_filename: 'cocina-madera-natural-2.jpg',
    imagen_url: '/vetadeoro/vetadeoro-cocinas-cocina-tonos-naturales-img-2.jpg',
    alt_text:
      'Cocina con tonos naturales y acabados en madera en vivienda Bogotá, proyecto personalizado Veta Dorada',
    image_title: 'Cocina Tonos Naturales en Madera - Bogotá | Veta Dorada',
    keywords: [
      'cocina madera',
      'tonos naturales',
      'diseño minimalista',
      'muebles cocina bogotá',
      'instalación bogotá',
    ],
    descripcion:
      'Cocina minimalista con acabados en madera natural que crean una atmósfera cálida y elegante. Proyecto personalizado con diseño a la medida de la vivienda.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Cocina Tonos Naturales en Madera',
    },
  },
  {
    imagen_filename: 'cocina-blanca-minimalista-3.jpg',
    imagen_url: '/vetadeoro/vetadeoro-cocinas-kitchen-white-modern-img-3.jpg',
    alt_text:
      'Cocina blanca minimalista con diseño contemporáneo en Bogotá, fabricación Veta Dorada',
    image_title: 'Cocina Blanca Minimalista Contemporánea - Bogotá | Veta Dorada',
    keywords: [
      'cocina blanca',
      'diseño minimalista',
      'cocina contemporánea',
      'muebles bogotá',
      'carpintería precision',
    ],
    descripcion:
      'Cocina blanca de líneas limpias que maximiza luminosidad y amplitud. Fabricada con precisión de fábrica e instalada profesionalmente en Bogotá.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Cocina Blanca Minimalista Contemporánea',
    },
  },
];

const testimoniosDemo: TestimonialItem[] = [
  {
    nombre_cliente: 'Testimonio Demo Uno',
    barrio: 'Usaquén',
    texto_resena: 'Excelente trabajo y atención. La cocina quedó exactamente como la imaginamos.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Demo Cocina Uno',
  },
  {
    nombre_cliente: 'Testimonio Demo Dos',
    barrio: 'Chicó',
    texto_resena: 'Equipo profesional y con gran capacidad de escucha. Muy satisfechos con el resultado.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Demo Cocina Dos',
  },
  {
    nombre_cliente: 'Testimonio Demo Tres',
    barrio: 'Rosales',
    texto_resena:
      'Proceso de diseño muy claro y transparente. La instalación fue rápida y cuidadosa.',
    calificacion: 5,
    proyecto_relacionado: 'Proyecto Demo Cocina Tres',
  },
];

export default function CocinasPage() {
  return (
    <SpaceShowcasePage
      categoryId="cocinas"
      title="Cocinas que organizan tu forma de vivir"
      subtitle="Cocinas a medida"
      description="Diseñamos cocinas integrales a medida para aprovechar cada centímetro, ordenar el trabajo diario y lograr un espacio coherente con tu casa."
      descriptionExtended="Diseñamos, fabricamos e instalamos cocinas integrales pensadas para tu ritmo y tu espacio. Cada proyecto comienza con una conversación profunda sobre cómo usas tu cocina, qué colores y materiales te hablan, y cómo queremos que se sienta el espacio. Luego nuestro equipo prepara visualizaciones 3D precisas para que decidas con confianza, y finalmente fabricamos con precisión de fábrica e instalamos con cuidado en tu hogar."
      images={cocinasImages}
      benefits={[
        'Distribuciones pensadas para tu rutina y las medidas reales del espacio.',
        'Selección de frentes, interiores, mesones y herrajes según el proyecto.',
        'Visualización previa en 3D para revisar la propuesta antes de fabricar.',
        'Fabricación e instalación coordinadas por Veta Dorada, sin intermediarios.',
      ]}
      testimonials={testimoniosDemo}
      ctaConfig={{
        whatsappLink: 'https://wa.me/573017604530?text=Hola+Veta+Dorada+Me+interesa+diseñar+mi+cocina',
        calendarLink: 'https://calendly.com/vetadeoro/consulta-inicial',
        primaryLabel: 'Consultar disponibilidad',
        secondaryLabel: 'Agendar visita',
      }}
      processNote="Fabricamos la solución aprobada en nuestro taller (Carrera 72A) y coordinamos una instalación cuidada en tu espacio, con asesoría técnica antes y después."
      socialProofStats={{
        projectsCompleted: 500,
        clientsSatisfied: 350,
        yearsExperience: 15,
      }}
    />
  );
}
