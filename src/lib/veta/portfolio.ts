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
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export type SpaceCategoryId = 'todos' | 'cocinas' | 'cavas_bares' | 'dormitorios_closets' | 'consolas_recibidores' | 'otros';

const CATEGORY_LABELS: Record<string, string> = {
  cocinas: 'Cocinas',
  cavas_bares: 'Cavas & Bares',
  dormitorios_closets: 'Dormitorios & Closets',
  consolas_recibidores: 'Consolas & Recibidores',
  otros: 'Otros',
};

export function categoryLabel(id: string): string {
  return CATEGORY_LABELS[id] ?? humanizeRecordText(id, id);
}

export function uniqueCategories(records: { categoria_espacio?: string }[]): SpaceCategoryId[] {
  const seen = new Set<string>();
  const cats: SpaceCategoryId[] = ['todos'];
  for (const r of records) {
    const c = r.categoria_espacio;
    if (c && !seen.has(c) && c in CATEGORY_LABELS) {
      seen.add(c);
      cats.push(c as SpaceCategoryId);
    }
  }
  return cats;
}
