type PortfolioSourceItem = {
  id?: string;
  data?: Record<string, unknown>;
};

function humanizeRecordText(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const normalized = value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return fallback;

  return normalized
    .toLowerCase()
    .replace(/\b\p{L}/gu, (char) => char.toUpperCase());
}

export type HomePortfolioCard = {
  id: string;
  title: string;
  subtitle: string;
  barrio: string;
  material: string;
  accent: string;
  tone: 'sun' | 'linen' | 'stone';
  /** TODO: reemplazar por fotografía real de proyecto Veta Dorada cuando exista banco propio */
  imageUrl: string;
};

const MOCK_CARDS: HomePortfolioCard[] = [
  {
    id: 'mock-cocina-luz',
    title: 'Cocina luminosa',
    subtitle: 'Planos limpios y luz natural para una cocina de uso diario.',
    barrio: 'Cedritos',
    material: 'Melamina RH + herrajes premium',
    accent: 'Luz natural',
    tone: 'sun',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'mock-vestier-biofilia',
    title: 'Vestier sobrio',
    subtitle: 'Orden visual, módulos cerrados y ritmo geométrico en el espacio.',
    barrio: 'Rosales',
    material: 'Madera técnica + iluminación cálida',
    accent: 'Orden visual',
    tone: 'linen',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'mock-bar-social',
    title: 'Bar social',
    subtitle: 'Una pieza de conversación que integra exhibición y almacenamiento.',
    barrio: 'Chicó',
    material: 'Laca satinada + vidrio + metal',
    accent: 'Pieza protagonista',
    tone: 'stone',
    imageUrl: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&q=80&w=1200',
  },
];

export function buildHomePortfolioCards(
  data: Record<string, PortfolioSourceItem[]> | undefined
): HomePortfolioCard[] {
  const spaces = (data?.espacio_variantes ?? [])
    .map((item) => item.data ?? {})
    .filter((item) => typeof item.nombre_espacio === 'string')
    .slice(0, 3);

  if (spaces.length === 0) return MOCK_CARDS;

  return spaces.map((space, index) => {
    const mock = MOCK_CARDS[index % MOCK_CARDS.length];
    return {
      id: String(space.nombre_espacio ?? mock.id),
      title: humanizeRecordText(space.nombre_espacio, mock.title),
      subtitle: humanizeRecordText(space.descripcion, mock.subtitle),
      barrio: humanizeRecordText(space.barrio_zona, mock.barrio),
      material: humanizeRecordText(space.material_principal, mock.material),
      accent: humanizeRecordText(space.etiqueta, mock.accent),
      tone: mock.tone,
      imageUrl: String((space as any).imagen_url || mock.imageUrl),
    };
  });
}

export function homeHeroNarrative() {
  return MOCK_CARDS[0];
}

export type SpaceCategoryId = 'todos' | 'cocinas' | 'cavas' | 'habitaciones' | 'consolas';

export type SpaceCatalogItem = {
  id: string;
  title: string;
  category: Exclude<SpaceCategoryId, 'todos'>;
  categoryLabel: string;
  image: string;
  description: string;
  materials: string[];
  dimensions: string;
};

export const SPACE_CATEGORY_TABS: Array<{ id: SpaceCategoryId; label: string }> = [
  { id: 'todos', label: 'Todos los Espacios' },
  { id: 'cocinas', label: 'Cocinas' },
  { id: 'cavas', label: 'Cavas & Bares' },
  { id: 'habitaciones', label: 'Dormitorios & Closets' },
  { id: 'consolas', label: 'Consolas & Recibidores' },
];

/** TODO: reemplazar por fotografía real de proyecto Veta Dorada cuando exista banco propio */
const FALLBACK_SPACE_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800';

export function buildSpaceCatalog(records: PortfolioSourceItem[] | undefined): SpaceCatalogItem[] {
  const spaces = (records ?? [])
    .filter((r) => typeof r.data?.nombre_espacio === 'string' && typeof r.data?.descripcion === 'string')
    .map((r, index) => {
      const d = r.data as Record<string, any>;
      const title = String(d.nombre_espacio ?? 'Espacio Veta Dorada');
      const categoryHint = typeof d.categoria_espacio === 'string' ? d.categoria_espacio : '';
      const lowerTitle = `${humanizeRecordText(title, title)} ${categoryHint}`.toLowerCase();

      let category: SpaceCatalogItem['category'] = 'consolas';
      let categoryLabel = 'Mobiliario Especializado';

      if (lowerTitle.includes('cocina')) {
        category = 'cocinas';
        categoryLabel = 'Cocinas de Diseñador';
      } else if (lowerTitle.includes('cava') || lowerTitle.includes('bar')) {
        category = 'cavas';
        categoryLabel = 'Cavas & Bares';
      } else if (lowerTitle.includes('cama') || lowerTitle.includes('closet') || lowerTitle.includes('habita')) {
        category = 'habitaciones';
        categoryLabel = 'Dormitorios & Closets';
      }

      const images = String(d.imagenes ?? '').split(',').map((s) => s.trim()).filter(Boolean);

      return {
        id: r.id || `space-item-${index}`,
        title: humanizeRecordText(title, 'Espacio Veta Dorada'),
        category,
        categoryLabel,
        image: images[0] || FALLBACK_SPACE_IMAGE,
        description: humanizeRecordText(d.descripcion, 'Espacio residencial exclusivo personalizado.'),
        materials: String(d.colores ?? '').split(',').map((s) => s.trim()).filter(Boolean).length
          ? String(d.colores).split(',').map((s) => humanizeRecordText(s, s)).filter(Boolean)
          : ['Madera Fina', 'Acabados Premium'],
        dimensions: humanizeRecordText(d.descripcion_alternativa, 'Diseño a medida'),
      };
    });

  return spaces;
}
