import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'cocina';

export const dynamic = 'force-dynamic';

const CONFIG: EspacioLandingConfig = {
  slug: 'cocinas-integrales-bogota',
  nombreCategoria: 'Cocinas Integrales',
  h1: 'Tus espacios a medida. Sin intermediarios.',
  subtitulo: 'Nuestros clientes estrenan cocina y tranquilidad.',
  parrafoDescriptor:
    'Cocinas integrales a medida en Bogotá. Materiales de primera, Madecor RH y acabados personalizados.',
  imageKey: 'espaciosCocinas',
  materiales: [
    {
      titulo: 'Fachadas y Estructura',
      cuerpo:
        'Usamos exclusivamente aglomerado Madecor RH (Resistente a la humedad) para los interiores, garantizando que tu cocina no se sople. Para las fachadas puedes elegir entre melaminas texturizadas de alta gama o acabados en Poliuretano para un brillo inmaculado.',
      imageSrc: '/images/home/fachadas.jpg',
    },
    {
      titulo: 'Funciones y Herrajes',
      cuerpo:
        'La calidad se siente al tacto. Integramos Herrajes Europeos (Blum, Hettich o Ducasse) con cierre lento, brazos neumáticos y rieles de carga pesada. Además, diseñamos la perfilería oculta con iluminación LED y sensores de movimiento integrados.',
      imageSrc: '/images/home/herrajes.jpg',
    },
    {
      titulo: 'Mesones',
      cuerpo:
        'Asesoramos la elección de la superficie ideal según el uso que le des a tu cocina. Trabajamos con Quarztone para resistencia al impacto, Granito natural para durabilidad clásica, y Piedra Sinterizada (Neolith/Dekton) para resistencia total al calor y rayones.',
      imageSrc: '/images/home/mesones.jpg',
    },
  ],
  faqs: [
    {
      pregunta: '¿Cuánto cuesta una cocina integral a la medida en Bogotá?',
      respuesta: 'El precio depende del tamaño, los materiales y los acabados. Una cocina en Madecor RH (estructuras resistentes a la humedad) con acabados estándar parte de un presupuesto base, mientras que fachadas en poliuretano o mesones en piedra sinterizada ajustan el valor hacia arriba. Lo mejor es agendar una visita técnica para obtener un presupuesto exacto línea por línea sin sorpresas.'
    },
    {
      pregunta: '¿Qué materiales usan para las cocinas integrales?',
      respuesta: 'Usamos interiores exclusivamente en Madecor RH (Resistente a la humedad) para garantizar la durabilidad a largo plazo. Para las fachadas, ofrecemos desde melaminas texturizadas hasta pintura en poliuretano o chapillas de madera maciza. Los mesones los trabajamos en Granito natural, Quarztone, o Piedra Sinterizada según la resistencia requerida.'
    }
  ]
};

export const metadata: Metadata = {
  title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
  description:
    'Cocinas integrales a medida en Bogotá. Nuestros clientes estrenan cocina y tranquilidad. Materiales de primera, Madecor RH y acabados personalizados.',
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
  ...socialMeta({
    title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
    description:
      'Cocinas integrales a medida en Bogotá. Nuestros clientes estrenan cocina y tranquilidad. Materiales de primera, Madecor RH y acabados personalizados.',
    path: `/espacios/${CONFIG.slug}`,
  }),
};

export default async function CocinasIntegralesPage() {
  const galeria = await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO);
  return <EspacioLanding config={CONFIG} galeria={galeria} tipoEspacio={TIPO_ESPACIO_CODIGO} />;
}
