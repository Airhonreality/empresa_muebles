import 'server-only';

import { getStrategy } from '@/server/getStrategy';
import type {
  PublicCommercialRecord,
  PublicHomeContent,
  PublicHomeSpace,
  PublicTestimonial,
} from '@/lib/veta/public-content';

type SourceRecord = { id: string; data?: Record<string, unknown> };

const asText = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const asNumber = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export type PublicStoreProduct = {
  slug_publico: string;
  tipo: 'prefabricado' | 'catalogo';
  nombre: string;
  descripcion_comercial?: string;
  categoria_comercial: string;
  precio_publico: number;
  imagen_url?: string;
  disponibilidad: 'disponible' | 'bajo_pedido' | 'agotado';
  dimensiones?: { ancho?: number | string; alto?: number | string; profundo?: number | string };
};

const PUBLIC_COMMERCIAL_KEYS = new Set([
  'logo_positivo_url',
  'logo_negativo_url',
  'brand_label_alternative',
  'whatsapp_number',
  'whatsapp_link',
  'instagram_url',
  'tiktok_url',
  'direccion_taller',
  'ciudad_operacion',
  'nit_legal',
  'nombre_empresa',
  'codigo_postal',
  'horario_semana',
  'horario_sabado',
]);

/**
 * Home is a public read model, not a view over operational space/project data.
 * Only explicitly published portfolio records participate in the projection.
 */
export async function getPublicHomeContent(): Promise<PublicHomeContent> {
  const strategy = getStrategy();
  const [configuracion, testimonios, portfolio, imagenes] = await Promise.all([
    strategy.read('configuracion_comercial') as Promise<SourceRecord[]>,
    strategy.read('testimonios') as Promise<SourceRecord[]>,
    strategy.read('portfolio_publico') as Promise<SourceRecord[]>,
    strategy.read('imagenes_portfolio') as Promise<SourceRecord[]>,
  ]);

  const commercial_config: PublicCommercialRecord[] = configuracion.flatMap((record) => {
    const key = asText(record.data?.llave);
    const value = asText(record.data?.valor);
    return key && value && PUBLIC_COMMERCIAL_KEYS.has(key)
      ? [{ data: { llave: key, valor: value } }]
      : [];
  });

  const testimonials: PublicTestimonial[] = testimonios.flatMap((record) => {
    const data = record.data ?? {};
    const name = asText(data.nombre_cliente);
    const review = asText(data.texto_resena);
    const rating = asNumber(data.calificacion);
    if (data.destacado !== true || !name || !review) return [];
    return [{
      data: {
        nombre_cliente: name,
        barrio: asText(data.barrio),
        texto_resena: review,
        calificacion: rating && rating >= 1 && rating <= 5 ? rating : undefined,
      },
    }];
  }).slice(0, 6);

  const imageByPortfolioId = new Map<string, string>();
  for (const image of imagenes) {
    const portfolioId = asText(image.data?.portfolio_id);
    const url = asText(image.data?.imagen_url);
    if (portfolioId && url && !imageByPortfolioId.has(portfolioId)) imageByPortfolioId.set(portfolioId, url);
  }

  const spaces: PublicHomeSpace[] = portfolio
    .filter((record) => record.data?.publicado === true)
    .sort((left, right) => (asNumber(left.data?.orden) ?? 0) - (asNumber(right.data?.orden) ?? 0))
    .flatMap((record) => {
      const data = record.data ?? {};
      const title = asText(data.titulo);
      const description = asText(data.descripcion_comercial);
      if (!title || !description) return [];
      const rawMaterials = asText(data.materiales_destacados) ?? '';
      return [{
        nombre_espacio: title,
        categoria_espacio: asText(data.categoria_espacio),
        descripcion: description,
        materiales: rawMaterials.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean).slice(0, 4),
        imagen_url: imageByPortfolioId.get(record.id),
      }];
    })
    .slice(0, 6);

  return { commercial_config, testimonials, spaces };
}

export type PublicPortfolioImage = {
  imagen_url: string;
  descripcion?: string;
};

export type PublicPortfolioEntry = {
  slug: string;
  titulo: string;
  descripcion_comercial?: string;
  zona: string;
  categoria_espacio: string;
  materiales_destacados?: string;
  destacado: boolean;
  imagenes: PublicPortfolioImage[];
};

/**
 * The only server-side projection allowed to feed the public storefront.
 * It intentionally omits record ids, supplier/cost fields, raw stock and source relations.
 */
export async function getPublicStoreProducts(): Promise<PublicStoreProduct[]> {
  const strategy = getStrategy();
  const [prefabricados, catalogo] = await Promise.all([
    strategy.read('prefabricados') as Promise<SourceRecord[]>,
    strategy.read('productos_catalogo') as Promise<SourceRecord[]>,
  ]);

  const prefabricadosPublicos = prefabricados.flatMap((record) => {
    const data = record.data ?? {};
    const slug = asText(data.slug_publico) ?? asText(data.slug);
    const nombre = asText(data.nombre);
    const precio = asNumber(data.precio_publico);
    if (data.publicado_web !== true || !slug || !nombre || !precio || precio <= 0) return [];
    return [{
      slug_publico: slug,
      tipo: 'prefabricado' as const,
      nombre,
      descripcion_comercial: asText(data.descripcion_comercial) ?? asText(data.descripcion),
      categoria_comercial: asText(data.categoria_comercial) ?? 'general',
      precio_publico: precio,
      imagen_url: asText(data.imagen_url),
      disponibilidad: 'bajo_pedido' as const,
    }];
  });

  const catalogoPublico = catalogo.flatMap((record) => {
    const data = record.data ?? {};
    // Catalog records are withheld until their editorial, stable public slug is set.
    const slug = asText(data.slug_publico);
    const nombre = asText(data.descripcion);
    const precio = asNumber(data.precio_publico);
    if (data.publicado_web !== true || !slug || !nombre || !precio || precio <= 0) return [];
    const stock = asNumber(data.stock_actual);
    const disponibilidad: PublicStoreProduct['disponibilidad'] = stock === undefined
      ? 'bajo_pedido'
      : stock > 0
        ? 'disponible'
        : 'agotado';
    return [{
      slug_publico: slug,
      tipo: 'catalogo' as const,
      nombre,
      descripcion_comercial: asText(data.descripcion_comercial) ?? nombre,
      categoria_comercial: asText(data.categoria_comercial) ?? 'general',
      precio_publico: precio,
      imagen_url: asText(data.imagen_url),
      disponibilidad,
      dimensiones: {
        ancho: asNumber(data.ancho) ?? asText(data.ancho),
        alto: asNumber(data.alto) ?? asText(data.alto),
        profundo: asNumber(data.profundo) ?? asText(data.profundo),
      },
    }];
  });

  return [...prefabricadosPublicos, ...catalogoPublico]
    .sort((left, right) => left.nombre.localeCompare(right.nombre, 'es-CO'));
}

/**
 * Server-enforced portfolio projection. Relation identifiers and client/location
 * information are joined privately and never cross the public boundary.
 */
export async function getPublicPortfolio(): Promise<PublicPortfolioEntry[]> {
  const strategy = getStrategy();
  const [portfolioRecords, imageRecords] = await Promise.all([
    strategy.read('portfolio_publico') as Promise<SourceRecord[]>,
    strategy.read('imagenes_portfolio') as Promise<SourceRecord[]>,
  ]);

  const imagesByPortfolioId = new Map<string, PublicPortfolioImage[]>();
  for (const record of imageRecords) {
    const data = record.data ?? {};
    const portfolioId = asText(data.portfolio_id);
    const imageUrl = asText(data.imagen_url);
    if (!portfolioId || !imageUrl) continue;

    const images = imagesByPortfolioId.get(portfolioId) ?? [];
    images.push({ imagen_url: imageUrl, descripcion: asText(data.descripcion) });
    imagesByPortfolioId.set(portfolioId, images);
  }

  return portfolioRecords
    .flatMap((record) => {
      const data = record.data ?? {};
      const slug = asText(data.slug);
      const titulo = asText(data.titulo);
      if (data.publicado !== true || !slug || !titulo) return [];

      return [{
        slug,
        titulo,
        descripcion_comercial: asText(data.descripcion_comercial),
        // Never expose exact address, neighborhood, customer initials, or project relation.
        zona: 'Bogot\u00e1',
        categoria_espacio: asText(data.categoria_espacio) ?? 'otros',
        materiales_destacados: asText(data.materiales_destacados),
        destacado: data.destacado === true,
        imagenes: imagesByPortfolioId.get(record.id) ?? [],
        orden: asNumber(data.orden) ?? 0,
      }];
    })
    .sort((left, right) => Number(right.destacado) - Number(left.destacado) || left.orden - right.orden)
    .map(({ orden: _orden, ...entry }) => entry);
}
