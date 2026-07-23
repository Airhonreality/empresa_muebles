'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Grid2x2,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { SmartImageInput } from '@/components/ui/SmartImageInput';
import ProveedoresDirectory from './ProveedoresDirectory';
import CatalogCollectionChrome from './CatalogCollectionChrome';
import type {
  Prefabricados,
  PrefabricadosRecord,
  ProductosCatalogo,
  ProductosCatalogoRecord,
  Proveedores,
  ProveedoresRecord,
} from '@/generated/agnostic-schemas';
import { cn } from '@/lib/utils';

import PrefabricadosComposer from './PrefabricadosComposer';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type CatalogRecord = Partial<ProductosCatalogo> & {
  imagen?: string;
  imagen_url?: string;
};
type ProviderRecord = Partial<Proveedores>;
type PrefabricadoRecord = Partial<Prefabricados>;

type CatalogFilters = {
  query: string;
  tipo: string;
  proveedor_id: string;
  categoria_comercial: string;
  publicado_web: 'all' | 'published' | 'hidden';
  stock: 'all' | 'low' | 'empty';
};

type CatalogFormState = {
  sku: string;
  tipo: string;
  descripcion: string;
  unidad_medida: string;
  ancho: string;
  alto: string;
  profundo: string;
  stock_actual: string;
  precio_directo: string;
  precio_publico: string;
  imagen: string;
  modelo_3d: string;
  url_referencia: string;
  proveedor_id: string;
  categoria_comercial: string;
  publicado_web: boolean;
};

const TYPE_OPTIONS = [
  'Tableros / Maderas',
  'Herrajes / Accesorios',
  'Modulos prefabricados',
  'Piedras / Mesones',
  'Electrodomesticos / Gasodomesticos',
  'Servicio',
  'Mueble Terminado',
  'Mano de Obra Civil',
  'Logística Obra Civil',
  'Materiales Obra Civil',
];

const CATEGORY_OPTIONS = [
  { label: 'Consolas / Recibidores', value: 'consolas' },
  { label: 'Cavas / Bares', value: 'cavas' },
  { label: 'Comedores', value: 'mesas' },
  { label: 'Camas', value: 'camas' },
];

const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  tipo: 'all',
  proveedor_id: 'all',
  categoria_comercial: 'all',
  publicado_web: 'all',
  stock: 'all',
};

const DEFAULT_FORM = (): CatalogFormState => ({
  sku: '',
  tipo: TYPE_OPTIONS[0] ?? 'Servicio',
  descripcion: '',
  unidad_medida: 'unidad',
  ancho: '',
  alto: '',
  profundo: '',
  stock_actual: '',
  precio_directo: '',
  precio_publico: '',
  imagen: '',
  modelo_3d: '',
  url_referencia: '',
  proveedor_id: '',
  categoria_comercial: CATEGORY_OPTIONS[0]?.value ?? 'consolas',
  publicado_web: false,
});

const currency = (value: unknown) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

const formatInteger = (value: unknown) =>
  Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-');

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isPublishableType = (tipo?: string) =>
  normalizeText(String(tipo || '')).includes(normalizeText('Modulos prefabricados'));

const canPublishRecord = (record?: Partial<CatalogRecord> | null) =>
  isPublishableType(String(record?.tipo || ''));

const isRecordPublished = (record?: Partial<CatalogRecord> | null) =>
  canPublishRecord(record) && !!record?.publicado_web;

const normalizeRecords = <T,>(payload: unknown): RecordItem<T>[] => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { records?: unknown[] })?.records)
      ? (payload as { records: unknown[] }).records
      : [];

  return source.map((item) => {
    const record = item as RecordItem<T>;
    return { ...record, ...(record.data || {}), id: record.id };
  });
};

function resolveCatalogImage(record?: Partial<CatalogRecord> | null) {
  return String(record?.imagen || record?.imagen_url || '');
}

async function readNamespace(namespace: string) {
  const res = await fetch(`/api/vault?namespace=${encodeURIComponent(namespace)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function writeRecord(namespace: string, id: string | undefined, data: Record<string, unknown>) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { id, data } }),
  });
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  return body.record ?? body;
}

async function removeRecord(namespace: string, id: string) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'REMOVE', namespace, id }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function executeZap(zapName: string, payload: Record<string, unknown>) {
  const res = await fetch('/api/engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zap: zapName, payload }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [query]);

  return matches;
}

function getProviderLabel(record: RecordItem<CatalogRecord>, providersById: Record<string, string>) {
  const providerId = String(record.proveedor_id || '');
  return providersById[providerId] || record.proveedor || 'Sin proveedor';
}

function isLowStock(record: RecordItem<CatalogRecord>) {
  return Number(record.stock_actual || 0) > 0 && Number(record.stock_actual || 0) <= 5;
}

function isEmptyStock(record: RecordItem<CatalogRecord>) {
  return Number(record.stock_actual || 0) <= 0;
}

function marginPercentage(record: RecordItem<CatalogRecord>) {
  const direct = Number(record.precio_directo || 0);
  const publicPrice = Number(record.precio_publico || 0);
  if (!direct || !publicPrice) return null;
  return Math.round(((publicPrice - direct) / direct) * 100);
}

function createCardPreview(record?: RecordItem<CatalogRecord> | null) {
  if (!record) return null;
  const imageUrl = resolveCatalogImage(record);
  const publishable = canPublishRecord(record);
  const published = isRecordPublished(record);
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
        {imageUrl ? (
          <img src={imageUrl} alt={String(record.descripcion || 'Producto')} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-stone-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white/80 shadow-sm">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin imagen</p>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/70 to-transparent px-4 py-4 text-white">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">
              {record.tipo || 'Sin tipo'}
            </Badge>
            {publishable ? (
              <Badge variant={published ? 'default' : 'outline'} className={cn('border-white/20', !published && 'bg-white/10 text-white')}>
                {published ? 'Publicado' : 'Privado'}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                Inventario
              </Badge>
            )}
          </div>
          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-tight">
            {record.descripcion || record.sku || 'Sin descripción'}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">SKU</p>
            <p className="text-sm font-semibold text-stone-900">{record.sku || 'Sin SKU'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Stock</p>
            <p className={cn('text-sm font-semibold', isEmptyStock(record) ? 'text-rose-700' : isLowStock(record) ? 'text-amber-700' : 'text-emerald-700')}>
              {formatInteger(record.stock_actual)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-stone-50 p-3 text-xs">
          <InfoBlock label="Directo" value={currency(record.precio_directo)} />
          <InfoBlock label="Público" value={currency(record.precio_publico)} />
          <InfoBlock label="Proveedor" value={getProviderLabel(record, {})} />
          <InfoBlock label="Segmento" value={record.categoria_comercial || '-'} />
        </div>
      </div>
    </div>
  );
}

export default function CatalogoManagerPremium() {
  const [activeTab, setActiveTab] = useState<'inventario' | 'prefabricados' | 'proveedores'>('inventario');
  const [catalogo, setCatalogo] = useState<RecordItem<CatalogRecord>[]>([]);
  const [proveedores, setProveedores] = useState<RecordItem<ProviderRecord>[]>([]);
  const [prefabricados, setPrefabricados] = useState<RecordItem<PrefabricadoRecord>[]>([]);
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editorForm, setEditorForm] = useState<CatalogFormState>(DEFAULT_FORM());
  const [editorError, setEditorError] = useState<string | null>(null);

  const isDesktop = useMediaQuery('(min-width: 1280px)');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catalogoRes, proveedoresRes, prefabricadosRes] = await Promise.all([
        readNamespace('productos_catalogo'),
        readNamespace('proveedores'),
        readNamespace('prefabricados'),
      ]);
      setCatalogo(normalizeRecords<ProductosCatalogo>(catalogoRes));
      setProveedores(normalizeRecords<Proveedores>(proveedoresRes));
      setPrefabricados(normalizeRecords<Prefabricados>(prefabricadosRes));
    } catch (error) {
      console.error('[CatalogoManagerPremium] loadData', error);
      toast.error('No se pudo cargar el catálogo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const providersById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const provider of proveedores) {
      map[provider.id] = provider.nombre || 'Proveedor';
    }
    return map;
  }, [proveedores]);

  const availableTipos = useMemo(() => {
    const fromData = catalogo.map((item) => String(item.tipo || '')).filter(Boolean);
    return Array.from(new Set([...TYPE_OPTIONS, ...fromData]));
  }, [catalogo]);

  const inventoryCatalog = useMemo(
    () => catalogo.filter((item) => !isPublishableType(String(item.tipo || ''))),
    [catalogo],
  );

  const publishableCatalog = useMemo(
    () => catalogo.filter((item) => isPublishableType(String(item.tipo || ''))),
    [catalogo],
  );

  const filteredCatalogo = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return [...inventoryCatalog]
      .filter((item) => {
        if (filters.tipo !== 'all' && String(item.tipo || '') !== filters.tipo) return false;
        if (!query) return true;

        return [
          item.sku,
          item.descripcion,
          item.tipo,
          item.proveedor,
          providersById[String(item.proveedor_id || '')],
          item.url_referencia,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const orderA = Number(isRecordPublished(b) ? 1 : 0) - Number(isRecordPublished(a) ? 1 : 0);
        if (orderA !== 0) return orderA;
        return String(a.descripcion || a.sku || '').localeCompare(String(b.descripcion || b.sku || ''), 'es', {
          numeric: true,
          sensitivity: 'base',
        });
      });
  }, [filters, inventoryCatalog, providersById]);

  const metrics = useMemo(() => {
    const total = inventoryCatalog.length;
    const publishableCount = publishableCatalog.length;
    const published = catalogo.filter((item) => isRecordPublished(item)).length;
    const lowStock = inventoryCatalog.filter((item) => isLowStock(item)).length;
    const emptyStock = inventoryCatalog.filter((item) => isEmptyStock(item)).length;
    const supplierCount = new Set(inventoryCatalog.map((item) => item.proveedor_id).filter(Boolean)).size;
    const prefabricatedCount = prefabricados.length;
    return { total, published, publishableCount, lowStock, emptyStock, supplierCount, prefabricatedCount };
  }, [catalogo, inventoryCatalog, prefabricados, publishableCatalog]);

  const activeRecord = useMemo(
    () => inventoryCatalog.find((item) => item.id === editingRecordId) || null,
    [editingRecordId, inventoryCatalog],
  );

  useEffect(() => {
    if (!mobileDetailOpen && !isDesktop) return;
    if (!activeRecord) setMobileDetailOpen(false);
  }, [activeRecord, isDesktop, mobileDetailOpen]);

  const resetEditor = () => {
    setEditingId('');
    setEditingRecordId(null);
    setEditorError(null);
    setEditorForm(DEFAULT_FORM());
  };

  const openNewEditor = () => {
    resetEditor();
    setEditorOpen(true);
  };

  const openEditor = (record: RecordItem<CatalogRecord>) => {
    setEditingId(record.id);
    setEditingRecordId(record.id);
    setEditorError(null);
    setEditorForm({
      sku: String(record.sku || ''),
      tipo: String(record.tipo || TYPE_OPTIONS[0] || 'Servicio'),
      descripcion: String(record.descripcion || ''),
      unidad_medida: String(record.unidad_medida || 'unidad'),
      ancho: String(record.ancho || ''),
      alto: String(record.alto || ''),
      profundo: String(record.profundo || ''),
      stock_actual: String(record.stock_actual ?? ''),
      precio_directo: String(record.precio_directo ?? ''),
      precio_publico: String(record.precio_publico ?? ''),
      imagen: String(record.imagen || record.imagen_url || ''),
      modelo_3d: String(record.modelo_3d || ''),
      url_referencia: String(record.url_referencia || ''),
      proveedor_id: String(record.proveedor_id || ''),
      categoria_comercial: String(record.categoria_comercial || CATEGORY_OPTIONS[0]?.value || 'consolas'),
      publicado_web: isPublishableType(String(record.tipo || '')) ? !!record.publicado_web : false,
    });
    setEditorOpen(true);
  };

  const openPreview = (record: RecordItem<CatalogRecord>) => {
    setEditingRecordId(record.id);
    if (isDesktop) return;
    setMobileDetailOpen(true);
  };

  const loadFreshRecord = async (id: string) => {
    const fresh = await readNamespace('productos_catalogo');
    const records = normalizeRecords<ProductosCatalogo>(fresh);
    return records.find((item) => item.id === id) || null;
  };

  const saveCatalogRecord = async (id: string | undefined, patch: Partial<CatalogRecord>) => {
    if (!id) {
      return writeRecord('productos_catalogo', crypto.randomUUID(), patch);
    }

    const current = await loadFreshRecord(id);
    const currentData = (current?.data || current || {}) as CatalogRecord;
    const merged = { ...currentData, ...patch };
    return writeRecord('productos_catalogo', id, merged);
  };

  const validateEditor = () => {
    if (!editorForm.descripcion.trim()) {
      return 'La descripción es obligatoria.';
    }
    if (editorForm.publicado_web) {
      if (!isPublishableType(editorForm.tipo)) return 'Solo los módulos prefabricados pueden publicarse en web.';
      if (!editorForm.descripcion.trim()) return 'La descripción comercial es obligatoria para publicar.';
      if (!editorForm.categoria_comercial) return 'El segmento comercial es obligatorio para publicar.';
      if (!editorForm.precio_publico || Number(editorForm.precio_publico) <= 0) return 'El precio público debe ser mayor a 0 para publicar.';
      if (!editorForm.imagen.trim()) return 'Se requiere una imagen para publicar en web.';
    }
    return null;
  };

  const persistEditor = async () => {
    const validationError = validateEditor();
    if (validationError) {
      setEditorError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      const providerLabel = providersById[editorForm.proveedor_id] || '';
      const nextSku = editorForm.sku.trim() || slugify(editorForm.descripcion || 'producto');
      const payload: CatalogRecord = {
        sku: nextSku,
        tipo: editorForm.tipo,
        descripcion: editorForm.descripcion.trim(),
        unidad_medida: editorForm.unidad_medida.trim(),
        ancho: editorForm.ancho.trim(),
        alto: editorForm.alto.trim(),
        profundo: editorForm.profundo.trim(),
        stock_actual: Number(editorForm.stock_actual) || 0,
        precio_directo: Number(editorForm.precio_directo) || 0,
        precio_publico: Number(editorForm.precio_publico) || 0,
        imagen: editorForm.imagen.trim(),
        imagen_url: editorForm.imagen.trim(),
        modelo_3d: editorForm.modelo_3d.trim(),
        url_referencia: editorForm.url_referencia.trim(),
        proveedor_id: editorForm.proveedor_id || '',
        proveedor: providerLabel,
        categoria_comercial: editorForm.categoria_comercial,
        publicado_web: isPublishableType(editorForm.tipo) && editorForm.publicado_web,
      };

      await saveCatalogRecord(editingId || undefined, payload);
      toast.success(editingId ? 'Producto actualizado.' : 'Producto creado.');
      setEditorOpen(false);
      resetEditor();
      await loadData();
    } catch (error) {
      console.error('[CatalogoManagerPremium] persistEditor', error);
      toast.error('No se pudo guardar el producto.');
    }
  };

  const duplicateRecord = async (record: RecordItem<CatalogRecord>) => {
    try {
      const copySku = `${String(record.sku || slugify(String(record.descripcion || 'producto')))}-copy`;
      await saveCatalogRecord(undefined, {
        ...(record.data || record),
        sku: copySku,
        publicado_web: false,
      });
      toast.success('Producto duplicado.');
      await loadData();
    } catch (error) {
      console.error('[CatalogoManagerPremium] duplicateRecord', error);
      toast.error('No se pudo duplicar el producto.');
    }
  };

  const togglePublished = async (record: RecordItem<CatalogRecord>) => {
    if (!isPublishableType(String(record.tipo || ''))) {
      toast.error('Solo los módulos prefabricados pueden publicarse en web.');
      return;
    }
    try {
      const nextPublished = !isRecordPublished(record);
      await saveCatalogRecord(record.id, { publicado_web: nextPublished });
      toast.success(nextPublished ? 'Producto publicado.' : 'Producto ocultado en web.');
      await loadData();
    } catch (error) {
      console.error('[CatalogoManagerPremium] togglePublished', error);
      toast.error('No se pudo cambiar la visibilidad web.');
    }
  };

  const deleteRecord = async (record: RecordItem<CatalogRecord>) => {
    const confirmed = window.confirm(`¿Eliminar "${record.descripcion || record.sku || 'producto'}"?`);
    if (!confirmed) return;

    try {
      await removeRecord('productos_catalogo', record.id);
      toast.success('Producto eliminado.');
      if (editingRecordId === record.id) {
        setEditingRecordId(null);
      }
      await loadData();
    } catch (error) {
      console.error('[CatalogoManagerPremium] deleteRecord', error);
      toast.error('No se pudo eliminar el producto.');
    }
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const providerOptions = useMemo(
    () => proveedores
      .map((provider) => ({
        id: provider.id,
        label: provider.nombre || 'Proveedor',
      }))
      // Radix <SelectItem> rompe el render si el value es cadena vacía;
      // descartamos proveedores sin id para evitar el crash.
      .filter((provider) => Boolean(provider.id))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })),
    [proveedores],
  );

  const detailRecord = activeTab === 'inventario' ? activeRecord || null : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.14),_transparent_28%),linear-gradient(180deg,_#faf7f2_0%,_#fffdf9_48%,_#f7f2ea_100%)] text-stone-950">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="sticky top-4 z-20 overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur">
          <CatalogCollectionChrome
            badges={(
              <>
                <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-900">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Premium inventory shell
                </Badge>
                <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 text-stone-700">
                  {metrics.total} productos
                </Badge>
                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800">
                  {metrics.published} publicados
                </Badge>
                <Badge variant="outline" className="rounded-full border-stone-200 bg-white text-stone-700">
                  {metrics.publishableCount} prefabricados
                </Badge>
              </>
            )}
            actions={activeTab === 'inventario' ? [{
              label: 'Nuevo producto',
              icon: <Plus className="h-4 w-4" />,
              onClick: openNewEditor,
              variant: 'default',
            }] : []}
            searchValue={activeTab === 'inventario' ? filters.query : ''}
            searchPlaceholder="SKU, descripción, proveedor..."
            onSearchChange={activeTab === 'inventario' ? (value) => setFilters((current) => ({ ...current, query: value })) : undefined}
            filterValue={activeTab === 'inventario' ? filters.tipo : undefined}
            filterPlaceholder="Tipo"
            onFilterChange={activeTab === 'inventario' ? (value) => setFilters((current) => ({ ...current, tipo: value })) : undefined}
            filterOptions={activeTab === 'inventario' ? [
              { value: 'all', label: 'Todos los tipos' },
              ...availableTipos.map((type) => ({ value: type, label: type })),
            ] : undefined}
            footer={(
              <div className="border-t border-stone-100 bg-stone-50/70 px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('inventario')}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                      activeTab === 'inventario'
                        ? 'border-stone-950 bg-stone-950 text-white shadow-md shadow-stone-950/10'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900',
                    )}
                  >
                    <Grid2x2 className="h-4 w-4" />
                    <span>Inventario</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px]', activeTab === 'inventario' ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-500')}>
                      {metrics.total}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('prefabricados')}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                      activeTab === 'prefabricados'
                        ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-md shadow-amber-950/5'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900',
                    )}
                  >
                    <Package className="h-4 w-4" />
                    <span>Productos prefabricados</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px]', activeTab === 'prefabricados' ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-500')}>
                      {metrics.prefabricatedCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('proveedores')}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                      activeTab === 'proveedores'
                        ? 'border-stone-950 bg-stone-950 text-white shadow-md shadow-stone-950/10'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900',
                    )}
                  >
                    <Warehouse className="h-4 w-4" />
                    <span>Proveedores</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px]', activeTab === 'proveedores' ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-500')}>
                      {proveedores.length}
                    </span>
                  </button>
                </div>
              </div>
            )}
          />

        </section>

        {activeTab === 'inventario' && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <main className="space-y-4">
              <section className="rounded-[1.75rem] border border-stone-200/70 bg-white/90 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.05)] backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                      Colección activa
                    </p>
                    <h2 className="text-xl font-black tracking-tight text-stone-950">
                      {filteredCatalogo.length} productos en pantalla
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
                        viewMode === 'cards'
                          ? 'bg-white text-stone-950 shadow-sm'
                          : 'text-stone-500 hover:text-stone-700',
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Tarjetas
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
                        viewMode === 'list'
                          ? 'bg-white text-stone-950 shadow-sm'
                          : 'text-stone-500 hover:text-stone-700',
                      )}
                    >
                      <List className="h-4 w-4" />
                      Lista
                    </button>
                  </div>
                </div>

              </section>

              {isLoading ? (
                <LoadingState />
              ) : filteredCatalogo.length === 0 ? (
                <EmptyState onCreate={openNewEditor} onReset={resetFilters} />
              ) : viewMode === 'cards' ? (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredCatalogo.map((record) => (
                    <ProductCard
                      key={record.id}
                      record={record}
                      providerLabel={getProviderLabel(record, providersById)}
                      active={editingRecordId === record.id}
                      canTogglePublished={isPublishableType(String(record.tipo || ''))}
                      onOpen={() => openPreview(record)}
                      onEdit={() => openEditor(record)}
                      onDuplicate={() => duplicateRecord(record)}
                      onTogglePublished={() => togglePublished(record)}
                      onDelete={() => deleteRecord(record)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCatalogo.map((record) => (
                    <ListRow
                      key={record.id}
                      record={record}
                      providerLabel={getProviderLabel(record, providersById)}
                      active={editingRecordId === record.id}
                      canTogglePublished={isPublishableType(String(record.tipo || ''))}
                      onOpen={() => openPreview(record)}
                      onEdit={() => openEditor(record)}
                      onDuplicate={() => duplicateRecord(record)}
                      onTogglePublished={() => togglePublished(record)}
                      onDelete={() => deleteRecord(record)}
                    />
                  ))}
                </div>
              )}
            </main>

            <aside className="hidden xl:block">
              <div className="sticky top-28 space-y-4">
                <section className="rounded-[1.75rem] border border-stone-200/70 bg-white/90 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.05)] backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                        Detalle premium
                      </p>
                      <h3 className="text-lg font-black text-stone-950">Vista activa</h3>
                    </div>
                    <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 text-stone-600">
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Panel
                    </Badge>
                  </div>
                  <div className="mt-4">
                    {detailRecord ? (
                      <CatalogDetail
                        record={detailRecord}
                        providerLabel={getProviderLabel(detailRecord, providersById)}
                        canTogglePublished={isPublishableType(String(detailRecord.tipo || ''))}
                        onEdit={() => openEditor(detailRecord)}
                        onDuplicate={() => duplicateRecord(detailRecord)}
                        onTogglePublished={() => togglePublished(detailRecord)}
                        onDelete={() => deleteRecord(detailRecord)}
                      />
                    ) : (
                      <DetailEmpty />
                    )}
                  </div>
                </section>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'prefabricados' && (
          <PrefabricadosComposer />
        )}

        {activeTab === 'proveedores' && (
          <ProveedoresDirectory />
        )}
      </div>

      <Sheet
        open={activeTab === 'inventario' && mobileDetailOpen && !!detailRecord && !isDesktop}
        onOpenChange={(open) => setMobileDetailOpen(open)}
      >
        <SheetContent side="right" className="w-full max-w-[540px] overflow-y-auto border-stone-200 bg-stone-50">
          <SheetHeader className="mb-4 border-b border-stone-200 pb-4 text-left">
            <SheetTitle className="text-xl font-black tracking-tight text-stone-950">Detalle del producto</SheetTitle>
            <SheetDescription className="text-sm text-stone-500">
              Vista de lectura y acciones rápidas para catálogo.
            </SheetDescription>
          </SheetHeader>
          {detailRecord ? (
            <CatalogDetail
              record={detailRecord}
              providerLabel={getProviderLabel(detailRecord, providersById)}
              canTogglePublished={isPublishableType(String(detailRecord.tipo || ''))}
              onEdit={() => {
                setMobileDetailOpen(false);
                openEditor(detailRecord);
              }}
              onDuplicate={() => duplicateRecord(detailRecord)}
              onTogglePublished={() => togglePublished(detailRecord)}
              onDelete={() => deleteRecord(detailRecord)}
            />
          ) : (
            <DetailEmpty />
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) resetEditor();
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-[2rem] border-stone-200 bg-white p-0">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-stone-100 p-5 xl:border-b-0 xl:border-r xl:p-6">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl font-black tracking-tight text-stone-950">
                  {editingId ? 'Editar producto' : 'Nuevo producto'}
                </DialogTitle>
                <DialogDescription className="text-sm text-stone-500">
                  El contrato actual del fork ya cubre estos campos: `tipo`, `proveedor_id`, `imagen`,
                  `precio_directo`, `precio_publico` y `publicado_web`.
                </DialogDescription>
              </DialogHeader>

              {editorError && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {editorError}
                </div>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="SKU">
                  <Input
                    value={editorForm.sku}
                    onChange={(event) => setEditorForm((current) => ({ ...current, sku: event.target.value }))}
                    placeholder="Opcional"
                    className="h-11 rounded-2xl border-stone-200"
                  />
                </Field>
                <Field label="Tipo">
                  <Select
                    value={editorForm.tipo}
                    onValueChange={(value) =>
                      setEditorForm((current) => ({
                        ...current,
                        tipo: value,
                        publicado_web: isPublishableType(value) ? current.publicado_web : false,
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-stone-200">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTipos.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="md:col-span-2">
                  <Field label="Descripción">
                    <Textarea
                      value={editorForm.descripcion}
                      onChange={(event) => setEditorForm((current) => ({ ...current, descripcion: event.target.value }))}
                      placeholder="Nombre visible del producto"
                      className="min-h-[96px] rounded-3xl border-stone-200"
                    />
                  </Field>
                </div>

                <Field label="Unidad de medida">
                  <Input
                    value={editorForm.unidad_medida}
                    onChange={(event) => setEditorForm((current) => ({ ...current, unidad_medida: event.target.value }))}
                    className="h-11 rounded-2xl border-stone-200"
                  />
                </Field>
                <Field label="Segmento comercial">
                  <Select
                    value={editorForm.categoria_comercial}
                    onValueChange={(value) => setEditorForm((current) => ({ ...current, categoria_comercial: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-stone-200">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Stock actual">
                  <Input
                    type="number"
                    value={editorForm.stock_actual}
                    onChange={(event) => setEditorForm((current) => ({ ...current, stock_actual: event.target.value }))}
                    className="h-11 rounded-2xl border-stone-200"
                  />
                </Field>
                <Field label="Proveedor">
                  <Select
                    value={editorForm.proveedor_id}
                    onValueChange={(value) => setEditorForm((current) => ({ ...current, proveedor_id: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-stone-200">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerOptions.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Precio directo">
                  <Input
                    type="number"
                    value={editorForm.precio_directo}
                    onChange={(event) => setEditorForm((current) => ({ ...current, precio_directo: event.target.value }))}
                    className="h-11 rounded-2xl border-stone-200"
                  />
                </Field>
                <Field label="Precio público">
                  <Input
                    type="number"
                    value={editorForm.precio_publico}
                    onChange={(event) => setEditorForm((current) => ({ ...current, precio_publico: event.target.value }))}
                    className="h-11 rounded-2xl border-stone-200"
                  />
                </Field>

                <Field label="Ancho">
                  <Input
                    value={editorForm.ancho}
                    onChange={(event) => setEditorForm((current) => ({ ...current, ancho: event.target.value }))}
                    className="h-11 rounded-2xl border-stone-200"
                  />
                </Field>
                <Field label="Alto">
                  <Input
                    value={editorForm.alto}
                    onChange={(event) => setEditorForm((current) => ({ ...current, alto: event.target.value }))}
                    className="h-11 rounded-2xl border-stone-200"
                  />
                </Field>

                <Field label="Profundo">
                  <Input
                    value={editorForm.profundo}
                    onChange={(event) => setEditorForm((current) => ({ ...current, profundo: event.target.value }))}
                    className="h-11 rounded-2xl border-stone-200"
                  />
                </Field>
                <Field label="URL de referencia">
                  <Input
                    value={editorForm.url_referencia}
                    onChange={(event) => setEditorForm((current) => ({ ...current, url_referencia: event.target.value }))}
                    className="h-11 rounded-2xl border-stone-200"
                    placeholder="https://..."
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Imagen">
                    <SmartImageInput
                      value={editorForm.imagen}
                      onChange={(value) => setEditorForm((current) => ({ ...current, imagen: value }))}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Modelo 3D">
                    <Input
                      value={editorForm.modelo_3d}
                      onChange={(event) => setEditorForm((current) => ({ ...current, modelo_3d: event.target.value }))}
                      className="h-11 rounded-2xl border-stone-200"
                      placeholder=".glb / .obj"
                    />
                  </Field>
                </div>

                <label className="flex items-start gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-4 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={editorForm.publicado_web}
                    onChange={(event) => setEditorForm((current) => ({ ...current, publicado_web: event.target.checked }))}
                    disabled={!isPublishableType(editorForm.tipo)}
                    className="mt-1 h-4 w-4"
                  />
                  <div>
                    <p className="text-sm font-semibold text-stone-950">Publicar en la web</p>
                    <p className="text-xs text-stone-500">
                      {isPublishableType(editorForm.tipo)
                        ? 'Requiere imagen, descripción comercial, segmento y precio público.'
                        : 'Solo los módulos prefabricados pueden publicarse en web.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-5 bg-gradient-to-b from-stone-50 to-white p-5 xl:p-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                  Vista previa comercial
                </p>
                {createCardPreview({
                  id: editingId || 'preview',
                  ...editorForm,
                  descripcion: editorForm.descripcion,
                  sku: editorForm.sku,
                  precio_directo: Number(editorForm.precio_directo) || 0,
                  precio_publico: Number(editorForm.precio_publico) || 0,
                  stock_actual: Number(editorForm.stock_actual) || 0,
                  publicado_web: editorForm.publicado_web,
                })}
              </div>

              <div className="grid gap-3 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                <SummaryLine label="Precio directo" value={currency(Number(editorForm.precio_directo) || 0)} />
                <SummaryLine label="Precio público" value={currency(Number(editorForm.precio_publico) || 0)} />
                <SummaryLine label="Stock" value={formatInteger(editorForm.stock_actual)} />
                <SummaryLine label="Proveedor" value={providersById[editorForm.proveedor_id] || 'Sin proveedor'} />
                <SummaryLine label="Tipo" value={editorForm.tipo} />
                <SummaryLine label="Segmento" value={editorForm.categoria_comercial} />
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4 text-sm text-stone-600">
                <p className="font-semibold text-stone-950">Contrato operativo</p>
                <ul className="mt-3 space-y-2 text-xs leading-5">
                  <li>• `tipo` es la clasificación visible de la lista.</li>
                  <li>• `proveedor_id` se guarda como relación canónica.</li>
                  <li>• `publicado_web` exige imagen y precio comercial.</li>
                  <li>• El guardado de edición mezcla primero el registro fresco antes de escribir.</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50 px-5 py-4 xl:px-6">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Badge variant="outline" className="rounded-full border-stone-200 bg-white text-stone-600">
                COP
              </Badge>
              <span>{editingId ? 'Actualización segura con merge completo' : 'Creación segura de nuevo registro'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)} className="rounded-full border-stone-200">
                Cancelar
              </Button>
              <Button onClick={persistEditor} className="rounded-full bg-stone-950 px-5 text-white hover:bg-stone-800">
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-2 last:border-none last:pb-0">
      <span className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-400">{label}</span>
      <span className="text-sm font-semibold text-stone-950">{value}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="aspect-[4/3] rounded-3xl bg-stone-100" />
          <div className="mt-4 h-4 w-2/3 rounded-full bg-stone-100" />
          <div className="mt-3 h-3 w-full rounded-full bg-stone-100" />
          <div className="mt-2 h-3 w-5/6 rounded-full bg-stone-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  onCreate,
  onReset,
}: {
  onCreate: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/90 p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950 text-white">
        <Package className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-black tracking-tight text-stone-950">Sin resultados</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-500">
        Los filtros están demasiado cerrados o todavía no hay productos visibles con ese criterio.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={onCreate} className="rounded-full bg-stone-950 text-white hover:bg-stone-800">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Button>
        <Button variant="outline" onClick={onReset} className="rounded-full border-stone-200">
          <Filter className="mr-2 h-4 w-4" />
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}

function DetailEmpty() {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-stone-200 bg-stone-50 px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
        <SlidersHorizontal className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-stone-900">Selecciona un producto</p>
      <p className="mt-1 text-xs leading-6 text-stone-500">
        Aquí se mostrará la ficha premium con acciones rápidas y vista previa.
      </p>
    </div>
  );
}

function ProductCard({
  record,
  providerLabel,
  active,
  canTogglePublished,
  onOpen,
  onEdit,
  onDuplicate,
  onTogglePublished,
  onDelete,
}: {
  record: RecordItem<CatalogRecord>;
  providerLabel: string;
  active: boolean;
  canTogglePublished: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onTogglePublished: () => void;
  onDelete: () => void;
}) {
  const margin = marginPercentage(record);
  const imageUrl = resolveCatalogImage(record);
  const published = isRecordPublished(record);

  return (
    <Card
      className={cn(
        'group overflow-hidden rounded-[1.75rem] border bg-white shadow-[0_15px_40px_rgba(15,23,42,0.05)] transition-all',
        active ? 'border-stone-950 ring-1 ring-stone-950/10' : 'border-stone-200/70 hover:-translate-y-0.5 hover:border-stone-300',
      )}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={String(record.descripcion || 'Producto')}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white/80 shadow-sm">
                <ImageIcon className="h-6 w-6" />
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/70 to-transparent p-4 text-white">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-white/15 bg-white/10 text-white">
                {record.tipo || 'Sin tipo'}
              </Badge>
              {canTogglePublished ? (
                <Badge variant={published ? 'default' : 'outline'} className={cn('border-white/15', !published && 'bg-white/10 text-white')}>
                  {published ? 'Publicado' : 'Oculto'}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-white/15 bg-white/10 text-white">
                  Inventario
                </Badge>
              )}
            </div>
            <p className="mt-3 line-clamp-2 text-lg font-black leading-tight">{record.descripcion || 'Sin descripción'}</p>
          </div>
        </div>
      </button>

      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">SKU</p>
            <p className="text-sm font-semibold text-stone-950">{record.sku || 'Sin SKU'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Stock</p>
            <p className={cn('text-sm font-semibold', isEmptyStock(record) ? 'text-rose-700' : isLowStock(record) ? 'text-amber-700' : 'text-emerald-700')}>
              {formatInteger(record.stock_actual)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-3xl bg-stone-50 p-3 text-xs">
          <InfoBlock label="Directo" value={currency(record.precio_directo)} />
          <InfoBlock label="Público" value={currency(record.precio_publico)} />
          <InfoBlock label="Proveedor" value={providerLabel} />
          <InfoBlock label="Margen" value={margin === null ? '-' : `${margin}%`} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full border-stone-200 bg-white text-stone-600">
            {record.categoria_comercial || 'Sin segmento'}
          </Badge>
          <Badge variant="outline" className="rounded-full border-stone-200 bg-white text-stone-600">
            {record.unidad_medida || 'unidad'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <IconActionButton label="Editar" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} />
          <IconActionButton label="Duplicar" icon={<Copy className="h-4 w-4" />} onClick={onDuplicate} />
          {canTogglePublished ? (
            <IconActionButton
              label={published ? 'Ocultar' : 'Publicar'}
              icon={published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              onClick={onTogglePublished}
            />
          ) : (
            <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Privado
            </Badge>
          )}
          <IconActionButton label="Eliminar" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} destructive />
        </div>
      </CardContent>
    </Card>
  );
}

function ListRow({
  record,
  providerLabel,
  active,
  canTogglePublished,
  onOpen,
  onEdit,
  onDuplicate,
  onTogglePublished,
  onDelete,
}: {
  record: RecordItem<CatalogRecord>;
  providerLabel: string;
  active: boolean;
  canTogglePublished: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onTogglePublished: () => void;
  onDelete: () => void;
}) {
  const imageUrl = resolveCatalogImage(record);
  const published = isRecordPublished(record);

  return (
    <div
      className={cn(
        'group rounded-[1.5rem] border bg-white p-3 shadow-sm transition-all',
        active ? 'border-stone-950' : 'border-stone-200/70 hover:border-stone-300',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <button type="button" onClick={onOpen} className="flex flex-1 items-center gap-3 text-left">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
            {imageUrl ? (
              <img src={imageUrl} alt={String(record.descripcion || 'Producto')} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 text-stone-600">
                {record.tipo || 'Sin tipo'}
              </Badge>
              {canTogglePublished ? (
                <Badge variant={published ? 'default' : 'outline'} className={cn('rounded-full', !published && 'bg-stone-50 text-stone-600')}>
                  {published ? 'Publicado' : 'Oculto'}
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 text-stone-600">
                  Inventario
                </Badge>
              )}
            </div>
            <p className="truncate text-base font-bold text-stone-950">{record.descripcion || 'Sin descripción'}</p>
            <p className="truncate text-sm text-stone-500">{record.sku || 'Sin SKU'} · {providerLabel}</p>
          </div>
        </button>

        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          <SummaryLine label="Stock" value={formatInteger(record.stock_actual)} />
          <SummaryLine label="Directo" value={currency(record.precio_directo)} />
          <SummaryLine label="Público" value={currency(record.precio_publico)} />
          <SummaryLine label="Segmento" value={record.categoria_comercial || '-'} />
          <SummaryLine label="Proveedor" value={providerLabel} />
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <IconActionButton label="Editar" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} />
          <IconActionButton label="Duplicar" icon={<Copy className="h-4 w-4" />} onClick={onDuplicate} />
          {canTogglePublished ? (
            <IconActionButton
              label={published ? 'Ocultar' : 'Publicar'}
              icon={published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              onClick={onTogglePublished}
            />
          ) : (
            <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Privado
            </Badge>
          )}
          <IconActionButton label="Eliminar" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} destructive />
        </div>
      </div>
    </div>
  );
}

function IconActionButton({
  label,
  icon,
  onClick,
  destructive = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-9 w-9 rounded-full border-stone-200 bg-white p-0 text-xs font-semibold',
        destructive && 'border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800',
      )}
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function CatalogDetail({
  record,
  providerLabel,
  canTogglePublished,
  onEdit,
  onDuplicate,
  onTogglePublished,
  onDelete,
}: {
  record: RecordItem<CatalogRecord>;
  providerLabel: string;
  canTogglePublished: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onTogglePublished: () => void;
  onDelete: () => void;
}) {
  const margin = marginPercentage(record);
  const imageUrl = resolveCatalogImage(record);
  const published = isRecordPublished(record);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
        <div className="aspect-[4/3] bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
          {imageUrl ? (
            <img src={imageUrl} alt={String(record.descripcion || 'Producto')} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-stone-400">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white/80 shadow-sm">
                <Package className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin imagen</p>
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 text-stone-600">
              {record.tipo || 'Sin tipo'}
            </Badge>
            {canTogglePublished ? (
              <Badge variant={published ? 'default' : 'outline'} className={cn('rounded-full', !published && 'bg-stone-50 text-stone-600')}>
                {published ? 'Publicado en web' : 'Oculto en web'}
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 text-stone-600">
                Inventario
              </Badge>
            )}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-stone-950">
            {record.descripcion || 'Sin descripción'}
          </h3>
          <p className="text-sm text-stone-500">{record.sku || 'Sin SKU'} · {providerLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-[1.5rem] border border-stone-200 bg-white p-4">
        <InfoBlock label="Stock actual" value={formatInteger(record.stock_actual)} />
        <InfoBlock label="Precio directo" value={currency(record.precio_directo)} />
        <InfoBlock label="Precio público" value={currency(record.precio_publico)} />
        <InfoBlock label="Margen" value={margin === null ? '-' : `${margin}%`} />
        <InfoBlock label="Unidad" value={record.unidad_medida || '-'} />
        <InfoBlock label="Segmento" value={record.categoria_comercial || '-'} />
        <InfoBlock label="Dimensiones" value={[record.ancho, record.alto, record.profundo].filter(Boolean).join(' × ') || '-'} />
        <InfoBlock label="Proveedor" value={providerLabel} />
      </div>

      <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Acciones</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <IconActionButton label="Editar" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} />
          <IconActionButton label="Duplicar" icon={<Copy className="h-4 w-4" />} onClick={onDuplicate} />
          {canTogglePublished ? (
            <IconActionButton
              label={published ? 'Ocultar' : 'Publicar'}
              icon={published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              onClick={onTogglePublished}
            />
          ) : null}
          <IconActionButton label="Eliminar" icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} destructive />
        </div>
      </div>

      {record.url_referencia ? (
        <a
          href={String(record.url_referencia)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 transition-colors hover:border-stone-300 hover:bg-white"
        >
          <span className="truncate">{record.url_referencia}</span>
          <ArrowRight className="ml-3 h-4 w-4 shrink-0" />
        </a>
      ) : null}

      {record.modelo_3d ? (
        <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Modelo 3D</p>
          <p className="mt-2 text-sm text-stone-700">{record.modelo_3d}</p>
        </div>
      ) : null}
    </div>
  );
}
