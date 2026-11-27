import type { Metadata } from 'next';
import { EspacioLanding, type EspacioLandingConfig } from '@/components/veta/espacio-landing';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerCanal } from '@/lib/contacto';
import { obtenerGaleriaEspacioAction, listarTestimoniosPublicadosAction } from '@/lib/data/actions/public';

const TIPO_ESPACIO_CODIGO = 'cocina';

const DESCRIPCION_SEO =
  'Cocinas integrales a medida en Bogotá, fabricadas directamente por nosotros. Melamina RH de 18 mm, herrajes europeos y acabados personalizados. Pide tu asesoría sin costo.';

// Caché de una hora: la página no es de sesión, y así no consulta la base en cada visita.
export const revalidate = 3600;

const CONFIG: EspacioLandingConfig = {
  slug: 'cocinas-integrales-bogota',
  nombreCategoria: 'Cocinas Integrales',
  h1: 'Cocinas integrales en Bogotá: diseño a medida',
  subtitulo: 'Cocinas integrales en Bogotá, diseñadas y fabricadas por nosotros: estructura en melamina RH de 18 mm, herrajes europeos y acabados a tu medida.',
  parrafoDescriptor:
    'Fabricantes directos en Bogotá. Sin intermediarios: diseñamos, fabricamos e instalamos tu cocina integral.',
  imageKey: 'espaciosCocinas',
  ctaTexto: 'Agenda una visita sin costo',
  visita: {
    titulo: 'Agenda una visita sin costo',
    cuerpo:
      'Un diseñador visita tu espacio en Bogotá, toma las medidas contigo y conversa sobre materiales y acabados. Con eso armamos una cotización preliminar, sin compromiso. Si ya tienes las medidas, puedes enviarlas desde el formulario, pero no es necesario.',
    ctaPrincipal: 'Agendar visita sin costo',
    mostrarGuiaMedidas: true,
  },
  direccion: 'Cra. 72a #71A 57, Bogotá',
  cobertura: 'Bogotá, Chía, Cota y Cajicá',
  ocultarPrecio3d: true,
  barraMovil: true,
  materiales: [
    {
      titulo: 'Fachadas y Estructura',
      cuerpo:
        'Toda la estructura y las fachadas estándar se fabrican en melamina RH diferencial de 18 mm, resistente a la humedad. Para un acabado premium puedes elegir fachadas en altobrillo o mate, y superficies de acrílico EGR o Glask.',
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
      respuesta: 'El precio depende del tamaño, los materiales y los acabados. Una cocina en melamina RH de 18 mm con acabados estándar parte de un presupuesto base, mientras que fachadas premium (altobrillo, mate, acrílico EGR o Glask) o mesones en piedra sinterizada ajustan el valor hacia arriba. Lo mejor es agendar una visita técnica para obtener un presupuesto exacto línea por línea sin sorpresas.'
    },
    {
      pregunta: '¿Qué materiales usan para las cocinas integrales?',
      respuesta: 'Toda la estructura, incluidas las fachadas estándar, se fabrica en melamina RH diferencial de 18 mm, resistente a la humedad. Como variaciones premium ofrecemos fachadas en altobrillo y mate, y superficies de acrílico EGR o Glask. Los mesones los trabajamos en granito natural, Quarztone o piedra sinterizada según la resistencia requerida.'
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
        'Diseño, fabricación e instalación de cocinas integrales a medida en Bogotá, con estructura en melamina RH de 18 mm y herrajes europeos.',
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
