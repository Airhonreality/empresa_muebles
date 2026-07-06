type ConfigMap = Record<string, string>;

type TestimonialRecord = {
  id?: string;
  data?: Record<string, unknown>;
};

const SITE_URL = 'https://vetadeoro.co';
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#local-business`;

const AREA_SERVING = [
  administrativeArea('Usaquén', ['Usaquén', 'Cedritos', 'Santa Bárbara']),
  administrativeArea('Chapinero', ['Chapinero', 'Rosales', 'Chicó', 'Quinta Camacho']),
  administrativeArea('Teusaquillo', ['Teusaquillo']),
  administrativeArea('Suba norte', ['Suba norte']),
];

export function readCommercialConfig(records: Array<{ data?: Record<string, unknown> }> | undefined): ConfigMap {
  return (records ?? []).reduce<ConfigMap>((acc, record) => {
    const key = record.data?.llave;
    const value = record.data?.valor;
    if (typeof key === 'string' && typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function buildOrganizationSchema(config: ConfigMap): Record<string, unknown> {
  const logo = absoluteUrl(config.logo_positivo_url || config.logo_negativo_url || '/api/assets/logo_veta_dorada_positive.svg');
  const sameAs = [config.instagram_url, config.tiktok_url].filter((value): value is string => typeof value === 'string' && value.length > 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Veta Dorada',
    alternateName: 'Veta de Oro',
    legalName: config.nombre_empresa || 'Hermanos Garcia Gonzalez SAS',
    url: SITE_URL,
    logo,
    image: logo,
    taxID: config.nit_legal || '901421357-9',
    email: 'vetadeoro.co@gmail.com',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: normalizePhone(config.whatsapp_number || '300 123 4567'),
        contactType: 'customer service',
        areaServed: 'CO',
        availableLanguage: ['es'],
      },
    ],
    sameAs,
  };
}

export function buildWebsiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Veta Dorada',
    url: SITE_URL,
    publisher: { '@id': ORGANIZATION_ID },
    inLanguage: 'es-CO',
  };
}

export function buildLocalBusinessSchema(
  config: ConfigMap,
  testimonials: TestimonialRecord[] = [],
  options: { includeGeo?: boolean } = {}
): Record<string, unknown> {
  const rating = buildAggregateRatingSchema(testimonials);
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'FurnitureStore', 'HomeAndConstructionBusiness'],
    '@id': LOCAL_BUSINESS_ID,
    name: 'Veta Dorada',
    legalName: config.nombre_empresa || 'Hermanos Garcia Gonzalez SAS',
    url: SITE_URL,
    telephone: normalizePhone(config.whatsapp_number || '300 123 4567'),
    email: 'vetadeoro.co@gmail.com',
    parentOrganization: { '@id': ORGANIZATION_ID },
    image: absoluteUrl(config.logo_positivo_url || config.logo_negativo_url || '/api/assets/logo_veta_dorada_positive.svg'),
    address: buildPostalAddress(config),
    openingHoursSpecification: buildOpeningHours(config),
    priceRange: '$$$',
    areaServed: AREA_SERVING,
    makesOffer: [
      offer('Cocinas integrales a medida', 'Diseño, fabricación e instalación de cocinas integrales en materiales premium.'),
      offer('Closets y vestidores a medida', 'Closets empotrados, walk-in closets y soluciones de almacenamiento.'),
      offer('Mobiliario arquitectónico', 'Bibliotecas, baños, centros de entretenimiento y piezas especiales a medida.'),
    ],
  };

  if (options.includeGeo && config.geo_latitud && config.geo_longitud) {
    const latitude = Number(config.geo_latitud);
    const longitude = Number(config.geo_longitud);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude,
        longitude,
      };
    }
  }

  if (rating) {
    schema.aggregateRating = rating;
  }

  return schema;
}

export function buildAggregateRatingSchema(testimonials: TestimonialRecord[] = []): Record<string, unknown> | null {
  const ratings = testimonials
    .map((item) => Number(item.data?.calificacion))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  if (ratings.length === 0) return null;

  const total = ratings.reduce((sum, value) => sum + value, 0);
  const ratingValue = Number((total / ratings.length).toFixed(1));

  return {
    '@type': 'AggregateRating',
    ratingValue,
    reviewCount: ratings.length,
    bestRating: 5,
    worstRating: 1,
  };
}

export function serializeJsonLd(schema: Record<string, unknown> | Record<string, unknown>[]): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

export function absoluteUrl(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${SITE_URL}${normalized}`;
}

function buildPostalAddress(config: ConfigMap): Record<string, unknown> {
  return {
    '@type': 'PostalAddress',
    streetAddress: config.direccion_taller || 'Carrera 72A # 71A-57',
    addressLocality: config.ciudad_operacion || 'Bogotá',
    addressRegion: 'Bogotá D.C.',
    postalCode: config.codigo_postal || undefined,
    addressCountry: 'CO',
  };
}

function buildOpeningHours(config: ConfigMap): Record<string, unknown>[] {
  const hours: Record<string, unknown>[] = [];
  if (config.horario_semana) {
    hours.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: parseOpenTime(config.horario_semana) ?? '08:00',
      closes: parseCloseTime(config.horario_semana) ?? '18:00',
    });
  }
  if (config.horario_sabado) {
    hours.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: parseOpenTime(config.horario_sabado) ?? '09:00',
      closes: parseCloseTime(config.horario_sabado) ?? '13:00',
    });
  }
  return hours;
}

function parseOpenTime(value: string): string | null {
  const match = value.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  return match?.[1] ?? null;
}

function parseCloseTime(value: string): string | null {
  const match = value.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  return match?.[2] ?? null;
}

function normalizePhone(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, '');
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('57')) return `+${compact}`;
  return `+57${compact}`;
}

function administrativeArea(name: string, places: string[]): Record<string, unknown> {
  return {
    '@type': 'AdministrativeArea',
    name,
    containsPlace: places.map((placeName) => ({
      '@type': 'Place',
      name: placeName,
    })),
  };
}

function offer(name: string, description: string): Record<string, unknown> {
  return {
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name,
      description,
      provider: { '@id': ORGANIZATION_ID },
    },
  };
}
