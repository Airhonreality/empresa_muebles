import type { Metadata } from 'next';
import EstudiosPage from '@/components/specialized/spaces/EstudiosPage';
import type { SeoImageData, TestimonialItem } from '@/components/specialized/spaces/types';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Estudios y home office a medida | Veta Dorada',
  description:
    'Diseño y fabricación de estudios y home office a medida para trabajar con orden y comodidad en Bogotá.',
};

const estudiosImages: SeoImageData[] = [
  {
    imagen_filename: 'estudio-moderno-1.jpg',
    imagen_url: '/vetadeoro/estudios-moderno-1.jpg',
    alt_text: 'Estudio home office moderno en Bogotá',
    image_title: 'Estudio Home Office Moderno',
    keywords: ['estudio', 'home office', 'workspace', 'productividad'],
    descripcion: 'Espacio de trabajo diseñado para máxima productividad y confort.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Estudio Moderno',
    },
  },
  {
    imagen_filename: 'estudio-funcional-2.jpg',
    imagen_url: '/vetadeoro/estudios-funcional-2.jpg',
    alt_text: 'Estudio funcional con almacenamiento',
    image_title: 'Estudio Funcional con Almacenamiento',
    keywords: ['almacenamiento', 'organización', 'espacio de trabajo'],
    descripcion: 'Solución funcional que organiza documentos y equipos.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Estudio Funcional',
    },
  },
  {
    imagen_filename: 'estudio-iluminado-3.jpg',
    imagen_url: '/vetadeoro/estudios-iluminado-3.jpg',
    alt_text: 'Estudio con iluminación natural',
    image_title: 'Estudio con Iluminación Natural',
    keywords: ['iluminación', 'ergonomía', 'confort'],
    descripcion: 'Estudio que aprovecha luz natural para mayor bienestar.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Estudio Iluminado',
    },
  },
];

const testimoniosDemo: TestimonialItem[] = [
  {
    nombre_cliente: 'Cliente Estudio Profesional',
    barrio: 'Usaquén',
    texto_resena:
      'Mi productividad aumentó dramáticamente. El estudio es cómodo y todo está en su lugar.',
    calificacion: 5,
    proyecto_relacionado: 'Estudio Usaquén',
  },
  {
    nombre_cliente: 'Cliente Home Office',
    barrio: 'Chapinero',
    texto_resena:
      'Finalmente tengo un espacio de trabajo real. Mis hijos respetan el espacio y mi concentración mejoró.',
    calificacion: 5,
    proyecto_relacionado: 'Home Office Chapinero',
  },
];

export default function EstudiosPageRoute() {
  return (
    <EstudiosPage
      title="Espacio que inspira, enfoca y calma"
      description="Diseñamos estudios y home offices que combinan concentración, almacenamiento y confort sin sacrificar la estética de tu hogar."
      descriptionExtended="Un buen estudio va más allá de un escritorio. Es donde se vuelve realidad tu productividad, tu creatividad, tu trabajo. Cada proyecto lo diseñamos pensando en ergonomía, iluminación, almacenamiento inteligente y cómo se integra con el resto de tu hogar."
      images={estudiosImages}
      benefits={[
        'Superficies de trabajo definidas según tu equipo y rutina.',
        'Almacenamiento para documentos, libros y elementos de uso diario.',
        'Soluciones para cables, iluminación y tecnología.',
        'Proporciones y acabados integrados al ambiente existente.',
      ]}
      testimonials={testimoniosDemo}
      ctaConfig={{
        whatsappLink:
          'https://wa.me/573017604530?text=Quiero+diseñar+mi+estudio+home+office',
        calendarLink: 'https://calendly.com/vetadeoro/consulta-inicial',
        primaryLabel: 'Consultar disponibilidad',
        secondaryLabel: 'Agendar visita',
      }}
      processNote="Fabricamos la solución con las medidas del espacio y coordinamos la instalación para dejarla lista para usar desde el primer día."
      socialProofStats={{
        projectsCompleted: 220,
        clientsSatisfied: 210,
        yearsExperience: 15,
      }}
    />
  );
}
