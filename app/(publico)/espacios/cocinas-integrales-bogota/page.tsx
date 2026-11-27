import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerCanal } from '@/lib/contacto';
import { obtenerGaleriaEspacioAction, listarTestimoniosPublicadosAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'cocina';

const DESCRIPCION_SEO =
  'Cocinas integrales a medida en Bogotá, fabricadas directamente por nosotros. Madecor RH, herrajes europeos y acabados personalizados. Pide tu asesoría sin costo.';

// Caché de una hora: la página no es de sesión, y así no consulta la base en cada visita.
export const revalidate = 3600;

const CONFIG: EspacioLandingConfig = {
  slug: 'cocinas-integrales-bogota',
  nombreCategoria: 'Cocinas Integrales',
  h1: 'Cocinas integrales en Bogotá: diseño a medida',
  subtitulo: 'Cocinas integrales en Bogotá, diseñadas y fabricadas por nosotros: interiores en Madecor RH, herrajes europeos y acabados a tu medida.',
  parrafoDescriptor:
    'Fabricantes directos en Bogotá. Sin intermediarios: diseñamos, fabricamos e instalamos tu cocina integral.',
  imageKey: 'espaciosCocinas',
  ctaTexto: 'Agenda tu asesoría sin costo',
  direccion: 'Cra. 72a #71A 57, Bogotá',
  cobertura: 'Bogotá, Chía, Cota y Cajicá',
  ocultarPrecio3d: true,
  barraMovil: true,
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
      imageSrc: '/images/home/cocina-herrajes-1600.webp',
    },
    {
      titulo: 'Mesón incluido en tu cocina',
      cuerpo:
        'El mesón se diseña y se instala como parte de tu cocina integral. Te asesoramos la superficie según el uso: Quarztone para resistencia al impacto, granito natural para durabilidad clásica o piedra sinterizada para resistencia al calor y a los rayones.',
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
    },
    {
      pregunta: '¿Hacen solo el mesón?',
      respuesta: 'No. Trabajamos el mesón únicamente como parte de una cocina integral completa.'
    }
  ]
};

export const metadata: Metadata = {
  title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
  description: DESCRIPCION_SEO,
  alternates: { canonical: `${SITE_URL}/espacios/${CONFIG.slug}` },
  icons: { apple: '/apple-touch-icon.png' },
  ...socialMeta({
    title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
    description: DESCRIPCION_SEO,
    path: `/espacios/${CONFIG.slug}`,
  }),
};

const canal = obtenerCanal('general');

const JSON_LD_COCINAS = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#negocio`,
      name: 'Veta Dorada',
      url: SITE_URL,
      telephone: canal.telefono,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Cra 72a #71a-57',
        addressLocality: 'Bogotá',
        addressRegion: 'Bogotá',
        addressCountry: 'CO',
      },
      areaServed: { '@type': 'City', name: 'Bogotá' },
      description: DESCRIPCION_SEO,
    },
    {
      '@type': 'Service',
      serviceType: 'Cocinas integrales a medida',
      provider: { '@id': `${SITE_URL}/#negocio` },
      areaServed: { '@type': 'City', name: 'Bogotá' },
      description:
        'Diseño, fabricación e instalación de cocinas integrales a medida en Bogotá, con interiores en Madecor RH y herrajes europeos.',
      url: `${SITE_URL}/espacios/cocinas-integrales-bogota`,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Espacios', item: `${SITE_URL}/espacios` },
        { '@type': 'ListItem', position: 3, name: 'Cocinas Integrales', item: `${SITE_URL}/espacios/cocinas-integrales-bogota` },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: (CONFIG.faqs ?? []).map((f) => ({
        '@type': 'Question',
        name: f.pregunta,
        acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
      })),
    },
  ],
};

export default async function CocinasIntegralesPage() {
  const [galeria, todos] = await Promise.all([
    obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO),
    listarTestimoniosPublicadosAction().catch(() => []),
  ]);

  // Prioriza testimonios de cocinas; si hay menos de tres, completa con los generales.
  const conTexto = todos.filter((t) => t.contenido && t.contenido.trim().length > 0);
  const deCocina = conTexto.filter((t) => (t.tipoProyecto ?? '').toLowerCase().includes('cocina'));
  const resto = conTexto.filter((t) => !deCocina.includes(t));
  const testimonios = [...deCocina, ...resto].slice(0, 3).map((t) => ({
    contenido: t.contenido,
    nombreAutor: t.nombreAutor,
    barrio: t.barrio,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_COCINAS) }}
      />
      <EspacioLanding
        config={{ ...CONFIG, testimonios }}
        galeria={galeria}
        tipoEspacio={TIPO_ESPACIO_CODIGO}
      />
    </>
  );
}
