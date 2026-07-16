'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, RefreshCw, Package, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import CatalogCollectionChrome from './CatalogCollectionChrome';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type PrefabricadoRecord = {
  nombre?: string;
  descripcion?: string;
  catalogo_id?: string;
  imagen_url?: string;
  descripcion_comercial?: string;
  categoria_comercial?: string;
  precio_publico?: number;
  precio_costo_calculado?: number;
  publicado_web?: boolean;
  reutilizable_catalogo?: boolean;
  slug?: string;
};

type PrefabricadoItemRecord = {
  prefabricado_id?: string;
  catalogo_id?: string;
  cantidad?: number;
  unidad_medida?: string;
  precio_unitario_snapshot?: number;
};

type CatalogRecord = {
  sku?: string;
  tipo?: string;
  descripcion?: string;
  unidad_medida?: string;
  precio_directo?: number;
  precio_publico?: number;
};

const categories = ['Cocina', 'Dormitorio', 'Baño', 'Sala', 'Oficina', 'Closet', 'Otro'];

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

async function writeRecord(namespace: string, id: string | undefined, data: Record<string, unknown>) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { id, data } })
  });
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  return body.record ?? body;
}

async function removeRecord(namespace: string, id: string) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'REMOVE', namespace, id })
  });
  if (!res.ok) throw new Error(await res.text());
}

async function executeZap(zapName: string, payload: Record<string, unknown>) {
  const res = await fetch('/api/engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zap: zapName, payload })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const currency = (value: unknown) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-');

export default function PrefabricadosComposer() {
  const [prefabricados, setPrefabricados] = useState<RecordItem<PrefabricadoRecord>[]>([]);
  const [prefabricadosItems, setPrefabricadosItems] = useState<RecordItem<PrefabricadoItemRecord>[]>([]);
  const [catalogo, setCatalogo] = useState<RecordItem<CatalogRecord>[]>([]);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'private'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [searchItems, setSearchItems] = useState('');
  const [itemsToAdd, setItemsToAdd] = useState<PrefabricadoItemRecord[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    descripcion_comercial: '',
    categoria_comercial: 'Cocina',
    precio_publico: '',
    publicado_web: false,
    reutilizable_catalogo: false,
    slug: ''
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prefabsRes, itemsRes, catalogoRes] = await Promise.all([
        fetch('/api/vault?namespace=prefabricados', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vault?namespace=prefabricados_items', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vault?namespace=productos_catalogo', { cache: 'no-store' }).then((r) => r.json())
      ]);
      setPrefabricados(normalizeRecords<PrefabricadoRecord>(prefabsRes));
      setPrefabricadosItems(normalizeRecords<PrefabricadoItemRecord>(itemsRes));
      setCatalogo(normalizeRecords<CatalogRecord>(catalogoRes));
    } catch {
      toast.error('No se pudo cargar datos de prefabricados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPrefabricados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...prefabricados]
      .filter((item) => {
        if (publishedFilter === 'published' && !item.publicado_web) return false;
        if (publishedFilter === 'private' && item.publicado_web) return false;
        if (!term) return true;
        return [item.nombre, item.slug, item.descripcion_comercial]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
  }, [prefabricados, publishedFilter, search]);

  const filteredCatalogo = useMemo(() => {
    const term = searchItems.trim().toLowerCase();
    return [...catalogo]
      .filter((item) => {
        if (!term) return true;
        return [item.sku, item.descripcion, item.tipo]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => String(a.descripcion || '').localeCompare(String(b.descripcion || '')));
  }, [catalogo, searchItems]);

  const resetForm = () => {
    setEditingId('');
    setForm({
      nombre: '',
      descripcion: '',
      descripcion_comercial: '',
      categoria_comercial: 'Cocina',
      precio_publico: '',
      publicado_web: false,
      reutilizable_catalogo: false,
      slug: ''
    });
    setItemsToAdd([]);
    setSearchItems('');
  };

  const openDialog = (record?: RecordItem<PrefabricadoRecord>) => {
    if (record) {
      setEditingId(record.id);
      setForm({
        nombre: record.nombre || '',
        descripcion: record.descripcion || '',
        descripcion_comercial: record.descripcion_comercial || '',
        categoria_comercial: record.categoria_comercial || 'Cocina',
        precio_publico: String(record.precio_publico ?? ''),
        publicado_web: record.publicado_web ?? false,
        reutilizable_catalogo: record.reutilizable_catalogo ?? false,
        slug: record.slug || ''
      });
      const items = prefabricadosItems.filter((pi) => pi.prefabricado_id === record.id);
      setItemsToAdd(items);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const autoSlug = () => {
    const slug = slugify(form.nombre);
    setForm((current) => ({ ...current, slug }));
  };

  const handleAddItem = (producto: RecordItem<CatalogRecord>) => {
    const exists = itemsToAdd.some((it) => it.catalogo_id === producto.id);
    if (exists) {
      toast.error('Este producto ya está en la lista.');
      return;
    }
    setItemsToAdd((current) => [
      ...current,
      {
        catalogo_id: producto.id,
        cantidad: 1,
        unidad_medida: producto.unidad_medida || 'und',
        precio_unitario_snapshot: producto.precio_directo || 0
      }
    ]);
  };

  const handleRemoveItem = (catalogoId: string) => {
    setItemsToAdd((current) => current.filter((it) => it.catalogo_id !== catalogoId));
  };

  const handleItemChange = (catalogoId: string, field: string, value: unknown) => {
    setItemsToAdd((current) =>
      current.map((it) => (it.catalogo_id === catalogoId ? { ...it, [field]: value } : it))
    );
  };

  const validateForm = () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio.');
      return false;
    }
    if (form.publicado_web) {
      if (!form.descripcion_comercial.trim()) {
        toast.error('La descripción comercial es obligatoria para publicar.');
        return false;
      }
      if (!form.categoria_comercial) {
        toast.error('La categoría comercial es obligatoria para publicar.');
        return false;
      }
      if (!form.precio_publico || Number(form.precio_publico) <= 0) {
        toast.error('El precio público debe ser mayor a 0 para publicar.');
        return false;
      }
      // Check for images
      if (!editingId) {
        toast.error('Se requiere al menos una imagen para publicar (será agregada en siguiente paso).');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const id = editingId || crypto.randomUUID();

      // Guardar prefabricado
      let catalogoId = prefabricados.find((p) => p.id === editingId)?.catalogo_id;
      if (form.reutilizable_catalogo && !catalogoId) {
        // Crear espejo en productos_catalogo
        const espejo = await writeRecord('productos_catalogo', crypto.randomUUID(), {
          sku: 'PREF-' + slugify(form.nombre),
          tipo: 'Prefabricado',
          descripcion: form.nombre,
          precio_directo: 0,
          precio_publico: Number(form.precio_publico) || 0,
          categoria_comercial: form.categoria_comercial
        });
        catalogoId = espejo.id;
      }

      await writeRecord('prefabricados', id, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        descripcion_comercial: form.descripcion_comercial.trim(),
        categoria_comercial: form.categoria_comercial,
        precio_publico: Number(form.precio_publico) || 0,
        publicado_web: form.publicado_web,
        reutilizable_catalogo: form.reutilizable_catalogo,
        slug: form.slug || slugify(form.nombre),
        catalogo_id: catalogoId || ''
      });

      // Guardar items
      for (const item of itemsToAdd) {
        const itemId = prefabricadosItems.find(
          (pi) => pi.prefabricado_id === id && pi.catalogo_id === item.catalogo_id
        )?.id;
        await writeRecord('prefabricados_items', itemId || crypto.randomUUID(), {
          prefabricado_id: id,
          catalogo_id: item.catalogo_id,
          cantidad: Number(item.cantidad) || 0,
          unidad_medida: item.unidad_medida || 'und',
          precio_unitario_snapshot: Number(item.precio_unitario_snapshot) || 0
        });
      }

      // Ejecutar zap para recalcular
      await executeZap('recalcular_precio_prefabricado', { prefabricado_id: id });

      toast.success(editingId ? 'Prefabricado actualizado.' : 'Prefabricado creado.');
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (e) {
      toast.error('No se pudo guardar: ' + String(e));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Eliminar items asociados
      const items = prefabricadosItems.filter((pi) => pi.prefabricado_id === id);
      for (const item of items) {
        await removeRecord('prefabricados_items', item.id);
      }
      // Eliminar prefabricado
      await removeRecord('prefabricados', id);
      toast.success('Prefabricado eliminado.');
      await loadData();
    } catch {
      toast.error('No se pudo eliminar el prefabricado.');
    }
  };

  const handleRecalculate = async (id: string) => {
    try {
      await executeZap('recalcular_precio_prefabricado', { prefabricado_id: id });
      toast.success('Costo recalculado.');
      await loadData();
    } catch {
      toast.error('No se pudo recalcular.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-4 z-20 overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur">
        <CatalogCollectionChrome
          badges={(
            <>
              <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-900">
                <Package className="mr-1 h-3 w-3" />
                Prefabricados
              </Badge>
              <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 text-stone-700">
                {filteredPrefabricados.length} módulos
              </Badge>
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800">
                {prefabricados.filter((item) => item.publicado_web).length} públicos
              </Badge>
            </>
          )}
          actions={[
            {
              label: 'Sincronizar',
              icon: <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />,
              onClick: loadData,
              variant: 'outline',
              disabled: isLoading,
            },
            {
              label: 'Nuevo módulo',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => openDialog(),
              variant: 'default',
            },
          ]}
          searchValue={search}
          searchPlaceholder="Buscar por nombre, slug o descripción"
          onSearchChange={setSearch}
          filterValue={publishedFilter}
          filterPlaceholder="Estado"
          onFilterChange={(value) => setPublishedFilter(value as 'all' | 'published' | 'private')}
          filterOptions={[
            { value: 'all', label: 'Todos' },
            { value: 'published', label: 'Públicos' },
            { value: 'private', label: 'Privados' },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          Cargando prefabricados...
        </div>
      ) : filteredPrefabricados.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No hay prefabricados definidos.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPrefabricados.map((item) => (
            <Card key={item.id} className="border-stone-200">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-base">{item.nombre || 'Sin nombre'}</CardTitle>
                  <p className="mt-1 text-xs text-stone-500">{item.slug || '-'}</p>
                  <div className="mt-2 flex gap-2">
                    {item.reutilizable_catalogo && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                        <CheckCircle2 className="h-3 w-3" /> Catálogo
                      </span>
                    )}
                    {item.publicado_web && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> Tienda
                      </span>
                    )}
                  </div>
                </div>
                <Package className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoBlock label="Costo Calculado" value={currency(item.precio_costo_calculado)} />
                  <InfoBlock label="Precio Público" value={currency(item.precio_publico)} />
                  <InfoBlock label="Categoría" value={item.categoria_comercial || '-'} />
                  <InfoBlock label="Items" value={String(prefabricadosItems.filter((pi) => pi.prefabricado_id === item.id).length)} />
                </div>

                {item.descripcion_comercial && (
                  <p className="text-xs text-stone-600">{item.descripcion_comercial}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openDialog(item)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => handleRecalculate(item.id)}>
                    <RefreshCw className="h-4 w-4" />
                    Recalcular
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 text-rose-700" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">
              {editingId ? 'Editar prefabricado' : 'Nuevo prefabricado'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-sm font-bold mb-3">Información Básica</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nombre">
                  <div className="flex gap-2">
                    <Input
                      value={form.nombre}
                      onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={autoSlug}>
                      Auto
                    </Button>
                  </div>
                </Field>
                <Field label="Slug (URL)">
                  <Input
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                    placeholder="auto-generado"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Descripción interna">
                    <Textarea
                      value={form.descripcion}
                      onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
                      className="h-16"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Información comercial */}
            <div>
              <h3 className="text-sm font-bold mb-3">Información Comercial</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Categoría Comercial">
                  <Select value={form.categoria_comercial} onValueChange={(value) => setForm((current) => ({ ...current, categoria_comercial: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Precio Público">
                  <Input
                    type="number"
                    value={form.precio_publico}
                    onChange={(event) => setForm((current) => ({ ...current, precio_publico: event.target.value }))}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Descripción Comercial (Markdown)">
                    <Textarea
                      value={form.descripcion_comercial}
                      onChange={(event) => setForm((current) => ({ ...current, descripcion_comercial: event.target.value }))}
                      className="h-20"
                      placeholder="Descripción para mostrar en la tienda"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Controles de disponibilidad */}
            <div className="border-t border-stone-200 pt-4">
              <h3 className="text-sm font-bold mb-3">Disponibilidad</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.reutilizable_catalogo}
                    onChange={(event) => setForm((current) => ({ ...current, reutilizable_catalogo: event.target.checked }))}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-semibold text-sm">Catálogo Interno</p>
                    <p className="text-xs text-stone-600">Reutilizable en cotizaciones (crea espejo en catálogo maestro)</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.publicado_web}
                    onChange={(event) => setForm((current) => ({ ...current, publicado_web: event.target.checked }))}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-semibold text-sm">Publicar en Tienda Web</p>
                    <p className="text-xs text-stone-600">Visible para clientes (requiere descripción comercial, categoría y precio)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Items del prefabricado */}
            <div className="border-t border-stone-200 pt-4">
              <h3 className="text-sm font-bold mb-3">Componentes (Items)</h3>
              <div className="space-y-3">
                {/* Búsqueda de productos */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-500 mb-2">
                    Agregar productos del catálogo
                  </label>
                  <Input
                    placeholder="Buscar SKU o descripción"
                    value={searchItems}
                    onChange={(event) => setSearchItems(event.target.value)}
                    className="mb-2"
                  />
                  {searchItems && filteredCatalogo.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-lg bg-stone-50">
                      {filteredCatalogo.slice(0, 10).map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleAddItem(prod)}
                          className="w-full text-left px-3 py-2 hover:bg-white border-b border-stone-100 text-sm flex justify-between items-start"
                        >
                          <div>
                            <p className="font-semibold text-stone-950">{prod.descripcion}</p>
                            <p className="text-xs text-stone-500">{prod.sku} · {currency(prod.precio_directo)}</p>
                          </div>
                          <Plus className="h-4 w-4 text-stone-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de items agregados */}
                {itemsToAdd.length > 0 && (
                  <div className="space-y-2">
                    {itemsToAdd.map((item, idx) => {
                      const producto = catalogo.find((p) => p.id === item.catalogo_id);
                      return (
                        <div key={idx} className="flex gap-2 items-end p-2 rounded-lg border border-stone-200 bg-stone-50">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{producto?.descripcion || 'Producto'}</p>
                            <p className="text-xs text-stone-500">{producto?.sku}</p>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div>
                              <label className="text-xs font-bold uppercase text-stone-500">Cantidad</label>
                              <Input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => handleItemChange(item.catalogo_id || '', 'cantidad', Number(e.target.value))}
                                className="w-20"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold uppercase text-stone-500">Unidad</label>
                              <Input
                                value={item.unidad_medida}
                                onChange={(e) => handleItemChange(item.catalogo_id || '', 'unidad_medida', e.target.value)}
                                className="w-20"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.catalogo_id || '')}
                              className="text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Prefabricado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[10px] font-black uppercase tracking-widest text-stone-500">{label}</span>
      {children}
    </label>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-1 font-semibold text-stone-950">{value}</p>
    </div>
  );
}
