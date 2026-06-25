import type { RouteResolution } from "@/lib/agnostic/resolver";

export const COMMERCIAL_CONFIG_NS = "configuracion_comercial";

const SITE_URL = "https://vetadeoro.co";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#local-business`;
const WEBSITE_ID = `${SITE_URL}/#website`;

type JsonLd = Record<string, unknown>;

type DataItem = {
  id?: string;
  data?: Record<string, unknown>;
};

const SERVICE_AREAS = [
  {
    "@type": "AdministrativeArea",
    name: "Chapinero Premium",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bogota",
      addressRegion: "Bogota D.C.",
      addressCountry: "CO",
      postalCode: ["110221", "110231"],
    },
    containsPlace: [
      place("La Cabrera", 4.66786, -74.05279),
      place("El Nogal", 4.66175, -74.05464),
      place("Los Rosales", 4.65596, -74.05358),
      place("Chico", 4.67128, -74.05243),
      place("Zona T", 4.66634, -74.05346),
      place("Club El Nogal", 4.66107, -74.05268),
      place("Centro Comercial Andino", 4.66607, -74.05370),
    ],
  },
  {
    "@type": "AdministrativeArea",
    name: "Usaquen Central y Norte",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bogota",
      addressRegion: "Bogota D.C.",
      addressCountry: "CO",
      postalCode: ["110111", "110121", "110131"],
    },
    containsPlace: [
      place("Santa Barbara", 4.69752, -74.03399),
      place("San Patricio", 4.69983, -74.04709),
      place("La Carolina", 4.70364, -74.03588),
      place("Bella Suiza", 4.72224, -74.03491),
      place("Cedritos", 4.72532, -74.04563),
      place("Santa Ana", 4.69373, -74.03516),
      place("Bosque Medina", 4.68658, -74.03063),
      place("Unicentro Bogota", 4.70157, -74.04236),
    ],
  },
  {
    "@type": "AdministrativeArea",
    name: "Suba residencial y campestre",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bogota",
      addressRegion: "Bogota D.C.",
      addressCountry: "CO",
      postalCode: ["111121", "111131", "111156", "111166"],
    },
    containsPlace: [
      place("Niza", 4.71193, -74.07230),
      place("Colina Campestre", 4.73540, -74.06452),
      place("San Jose de Bavaria", 4.75685, -74.08291),
      place("Guaymaral", 4.79525, -74.04335),
      place("Club Los Lagartos", 4.71962, -74.09049),
      place("Country Club de Bogota", 4.71528, -74.04643),
    ],
  },
  {
    "@type": "AdministrativeArea",
    name: "Salitre y occidente ejecutivo",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bogota",
      addressRegion: "Bogota D.C.",
      addressCountry: "CO",
      postalCode: ["110931", "111071", "111061"],
    },
    containsPlace: [
      place("Ciudad Salitre", 4.64891, -74.10482),
      place("Quinta Paredes", 4.63644, -74.09134),
      place("Modelia", 4.66965, -74.11682),
      place("Normandia", 4.67052, -74.10499),
      place("La Felicidad", 4.65237, -74.12954),
    ],
  },
  {
    "@type": "AdministrativeArea",
    name: "Teusaquillo y Barrios Unidos creativo",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bogota",
      addressRegion: "Bogota D.C.",
      addressCountry: "CO",
      postalCode: ["111211", "111221", "111311"],
    },
    containsPlace: [
      place("Teusaquillo", 4.64074, -74.07899),
      place("La Soledad", 4.63790, -74.07197),
      place("Pablo VI", 4.64949, -74.08960),
      place("San Felipe", 4.66090, -74.06833),
      place("Quinta Camacho", 4.65482, -74.06193),
    ],
  },
];

const ROUTE_SERVICES: Record<string, { name: string; serviceType: string; description: string }> = {
  "/espacios-a-medida": {
    name: "Fabricacion de espacios a medida en Bogota",
    serviceType: "Mobiliario arquitectonico a medida",
    description:
      "Diseno, fabricacion e instalacion de cocinas, closets, bibliotecas, banos y mobiliario arquitectonico a medida para viviendas y oficinas en Bogota.",
  },
  "/agendar": {
    name: "Visita tecnica de mobiliario a medida en Bogota",
    serviceType: "Agendamiento de visita tecnica",
    description:
      "Visita tecnica para rectificacion de medidas, asesoria de materiales y cotizacion de proyectos de mobiliario a medida en Bogota.",
  },
};

export function buildOrganizationJsonLd(vaultData: Record<string, DataItem[]>): JsonLd {
  const config = readCommercialConfig(vaultData);
  const legalName = config.nombre_empresa ?? "Hermanos Garcia Gonzalez SAS";

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Veta Dorada",
    alternateName: "Veta de Oro",
    legalName,
    url: SITE_URL,
    logo: absoluteUrl(config.logo_positivo_url ?? "/api/assets/logo_veta_dorada_positive.svg"),
    image: absoluteUrl(config.logo_positivo_url ?? "/api/assets/logo_veta_dorada_positive.svg"),
    foundingDate: "1995",
    taxID: config.nit_legal ?? "901421357-9",
    email: "vetadeoro.co@gmail.com",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: normalizePhone(config.whatsapp_number ?? "302 5922101"),
        contactType: "customer service",
        areaServed: "CO",
        availableLanguage: ["es"],
      },
    ],
    sameAs: [
      config.instagram_url,
      config.tiktok_url,
    ].filter(Boolean),
  };
}

export function buildRouteJsonLd(
  resolution: RouteResolution,
  vaultData: Record<string, DataItem[]>
): JsonLd[] {
  if (!resolution.route || resolution.path.startsWith("/app")) return [];

  const routeTitle = String(resolution.route.data?.title ?? "Veta Dorada");
  const schemas: JsonLd[] = [
    buildWebPageJsonLd(resolution.path, routeTitle),
    buildBreadcrumbJsonLd(resolution.path, routeTitle),
  ];

  if (resolution.path === "/") {
    schemas.push(buildLocalBusinessJsonLd(vaultData), buildWebsiteJsonLd());
  }

  const service = ROUTE_SERVICES[resolution.path];
  if (service) {
    schemas.push(buildServiceJsonLd(resolution.path, service));
  }

  if (resolution.path === "/colecciones") {
    schemas.push(buildCollectionJsonLd(vaultData));
  }

  return schemas;
}

export function serializeJsonLd(schema: JsonLd | JsonLd[]): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

function buildLocalBusinessJsonLd(vaultData: Record<string, DataItem[]>): JsonLd {
  const config = readCommercialConfig(vaultData);

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "FurnitureStore", "HomeAndConstructionBusiness"],
    "@id": LOCAL_BUSINESS_ID,
    name: "Veta Dorada",
    legalName: config.nombre_empresa ?? "Hermanos Garcia Gonzalez SAS",
    url: SITE_URL,
    telephone: normalizePhone(config.whatsapp_number ?? "302 5922101"),
    email: "vetadeoro.co@gmail.com",
    parentOrganization: { "@id": ORGANIZATION_ID },
    image: absoluteUrl(config.logo_positivo_url ?? "/api/assets/logo_veta_dorada_positive.svg"),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Cra 72A 71A 57",
      addressLocality: "Bogota",
      addressRegion: "Bogota D.C.",
      postalCode: "111051",
      addressCountry: "CO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 4.67961,
      longitude: -74.09371,
    },
    openingHours: "Mo-Fr 08:00-18:00 Sa 09:00-14:00",
    priceRange: "$$$",
    areaServed: SERVICE_AREAS,
    makesOffer: [
      offer("Cocinas integrales a medida", "Fabricacion e instalacion de cocinas integrales en tableros RH, herrajes premium y acabados personalizados."),
      offer("Closets y vestidores a medida", "Diseno y fabricacion de closets empotrados, walk-in closets y soluciones de almacenamiento a medida."),
      offer("Mobiliario arquitectonico", "Bibliotecas, banos, centros de entretenimiento, oficinas y piezas especiales fabricadas por taller directo."),
    ],
  };
}

function buildWebsiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Veta Dorada",
    url: SITE_URL,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "es-CO",
  };
}

function buildWebPageJsonLd(path: string, title: string): JsonLd {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    inLanguage: "es-CO",
  };
}

function buildBreadcrumbJsonLd(path: string, title: string): JsonLd {
  const cleanTitle = path === "/" ? "Inicio" : title;
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: SITE_URL,
    },
  ];

  if (path !== "/") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: cleanTitle,
      item: absoluteUrl(path),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function buildServiceJsonLd(
  path: string,
  service: { name: string; serviceType: string; description: string }
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service`,
    name: service.name,
    serviceType: service.serviceType,
    description: service.description,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: SERVICE_AREAS,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/agendar`,
      availability: "https://schema.org/InStock",
      priceCurrency: "COP",
      category: "Visita tecnica y cotizacion",
    },
  };
}

function buildCollectionJsonLd(vaultData: Record<string, DataItem[]>): JsonLd {
  const products = (vaultData.productos_catalogo ?? [])
    .map((item) => item.data ?? {})
    .filter((data) => typeof data.nombre === "string" || typeof data.descripcion === "string")
    .slice(0, 12);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/colecciones#collection`,
    name: "Colecciones de mobiliario Veta Dorada",
    url: `${SITE_URL}/colecciones`,
    about: { "@id": ORGANIZATION_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.nombre ?? product.descripcion,
          description: product.descripcion,
          brand: { "@id": ORGANIZATION_ID },
          category: product.tipo ?? product.categoria,
          offers: product.precio_publico ?? product.precio
            ? {
                "@type": "Offer",
                price: product.precio_publico ?? product.precio,
                priceCurrency: "COP",
                availability: "https://schema.org/InStock",
                url: `${SITE_URL}/colecciones`,
              }
            : undefined,
        },
      })),
    },
  };
}

function readCommercialConfig(vaultData: Record<string, DataItem[]>): Record<string, string> {
  const records = vaultData[COMMERCIAL_CONFIG_NS] ?? [];

  return records.reduce<Record<string, string>>((acc, record) => {
    const key = record.data?.llave;
    const value = record.data?.valor;
    if (typeof key === "string" && typeof value === "string") {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function absoluteUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${SITE_URL}${normalized}`;
}

function normalizePhone(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) return compact;
  if (compact.startsWith("57")) return `+${compact}`;
  return `+57${compact}`;
}

function place(name: string, latitude: number, longitude: number): JsonLd {
  return {
    "@type": "Place",
    name,
    geo: {
      "@type": "GeoCoordinates",
      latitude,
      longitude,
    },
  };
}

function offer(name: string, description: string): JsonLd {
  return {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name,
      description,
      provider: { "@id": ORGANIZATION_ID },
    },
  };
}
