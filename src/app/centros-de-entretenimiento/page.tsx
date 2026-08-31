import type { Metadata } from 'next';
import EntretenimientoPage from '@/components/specialized/spaces/EntretenimientoPage';
import type { SeoImageData, TestimonialItem } from '@/components/specialized/spaces/types';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Centros de entretenimiento a medida | Veta Dorada',
  description:
    'Centros de entretenimiento y muebles para salas diseñados a medida en Bogotá.',
};

const entretenimientoImages: SeoImageData[] = [
  {
    imagen_filename: 'centro-entretenimiento-1.jpg',
    imagen_url: '/vetadeoro/entretenimiento-centro-1.jpg',
    alt_text: 'Centro de entretenimiento moderno en Bogotá',
    image_title: 'Centro de Entretenimiento Moderno',
    keywords: ['centro entretenimiento', 'mueble sala', 'tv integrada'],
    descripcion: 'Centro de entretenimiento que integra tecnología sin ruido visual.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Centro de Entretenimiento',
    },
  },
  {
    imagen_filename: 'centro-entretenimiento-2.jpg',
    imagen_url: '/vetadeoro/entretenimiento-centro-2.jpg',
    alt_text: 'Sistema modular de entretenimiento',
    image_title: 'Sistema Modular de Entretenimiento',
    keywords: ['entretenimiento modular', 'almacenamiento', 'equipos'],
    descripcion: 'Solución modular para equipos, cables y almacenamiento.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Sistema Modular',
    },
  },
  {
    imagen_filename: 'centro-entretenimiento-3.jpg',
    imagen_url: '/vetadeoro/entretenimiento-centro-3.jpg',
    alt_text: 'Centro de entretenimiento con iluminación',
    image_title: 'Centro con Iluminación Integrada',
    keywords: ['iluminación', 'ambiente', 'tecnología'],
    descripcion: 'Centro que integra iluminación adaptativa.',
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: 'Centro con Iluminación',
    },
  },
];

const testimoniosDemo: TestimonialItem[] = [
  {
    nombre_cliente: 'Cliente Entretenimiento',
    barrio: 'Rosales',
    texto_resena:
      'La sala es ahora el centro de reuniones perfecto. Todos queremos pasar tiempo aquí.',
    calificacion: 5,
    proyecto_relacionado: 'Centro Entretenimiento Rosales',
  },
  {
    nombre_cliente: 'Cliente Fiesta',
    barrio: 'Teusaquillo',
    texto_resena:
      'El sistema de sonido integrado cambió todo. Las fiestas son leyendarias.',
    calificacion: 5,
    proyecto_relacionado: 'Centro Fiestas Teusaquillo',
  },
];

export default function EntretenimientoPageRoute() {
  return (
    <EntretenimientoPage
      title="Tu centro de entretenimiento perfecto"
      description="Diseñamos espacios de entretenimiento que integran tecnología, confort y diversión sin perder la elegancia visual."
      descriptionExtended="Un buen centro de entretenimiento no es solo un mueble para la TV. Es el corazón social de tu hogar, donde se reúnen amigos, familia y momentos memorables. Integramos audio, iluminación, almacenamiento y confort en cada proyecto."
      images={entretenimientoImages}
      benefits={[
        'Medidas y proporciones ajustadas al muro y a la pantalla.',
        'Canalización y organización visual para equipos y conexiones.',
        'Combinación de nichos, puertas, cajones y superficies de apoyo.',
        'Diseño pensado para convivir con el resto del ambiente.',
      ]}
      testimonials={testimoniosDemo}
      ctaConfig={{
        whatsappLink:
          'https://wa.me/573017604530?text=Quiero+diseñar+mi+centro+de+entretenimiento',
        calendarLink: 'https://calendly.com/vetadeoro/consulta-inicial',
        primaryLabel: 'Consultar disponibilidad',
        secondaryLabel: 'Agendar visita',
      }}
      processNote="Diseñamos considerando posicionamiento de pantalla, flujo de cables, iluminación y acústica. Cada detalle se cuida en fabricación e instalación."
      socialProofStats={{
        projectsCompleted: 180,
        clientsSatisfied: 170,
        yearsExperience: 15,
      }}
    />
  );
}
