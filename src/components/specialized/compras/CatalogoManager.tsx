'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, RefreshCw, Search, Package, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PrefabricadosComposer from './PrefabricadosComposer';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type CatalogRecord = {
  sku?: string;
  tipo?: string;
  descripcion?: string;
  unidad_medida?: string;
  stock_actual?: number;
  precio_directo?: number;
  precio_publico?: number;
  imagen_url?: string;
  modelo_3d?: string;
  url_referencia?: string;
  proveedor_id?: string;
  categoria_comercial?: string;
};

type ProviderRecord = {
  nombre?: string;
};

const types = ['Insumo', 'Servicio', 'Herraje', 'Acabado', 'Madera', 'Otro'];
const units = ['und', 'm', 'm2', 'placa', 'lt', 'kg', 'servicio'];
const categories = ['Comercial', 'Tecnico', 'Acabados', 'Logistica', 'Produccion', 'Otro'];

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

const currency = (value: unknown) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

export default function CatalogoManager() {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'modulos'>('catalogo');
  const [catalogo, setCatalogo] = useState<RecordItem<CatalogRecord>[]>([]);
  const [proveedores, setProveedores] = useState<RecordItem<ProviderRecord>[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    sku: '',
    tipo: 'Insumo',
    descripcion: '',
    unidad_medida: 'und',
    stock_actual: '',
    precio_directo: '',
    precio_publico: '',
    imagen_url: '',
    modelo_3d: '',
    url_referencia: '',
    proveedor_id: '',
    categoria_comercial: 'Comercial'
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catalogoRes, proveedoresRes] = await Promise.all([
        fetch('/api/vault?namespace=productos_catalogo', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vault?namespace=proveedores', { cache: 'no-store' }).then((r) => r.json())
      ]);
      setCatalogo(normalizeRecords<CatalogRecord>(catalogoRes));
      setProveedores(normalizeRecords<ProviderRecord>(proveedoresRes));
    } catch {
      toast.error('No se pudo cargar el catalogo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCatalogo = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...catalogo]
      .filter((item) => {
        if (!term) return true;
        return [item.sku, item.descripcion, item.tipo, item.categoria_comercial, item.proveedor_id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => String(a.descripcion || '').localeCompare(String(b.descripcion || '')));
  }, [catalogo, search]);

  const providersById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const provider of proveedores) {
      map[provider.id] = provider.nombre || 'Proveedor';
    }
    return map;
  }, [proveedores]);

  const resetForm = () => {
    setEditingId('');
    setForm({
      sku: '',
      tipo: 'Insumo',
      descripcion: '',
      unidad_medida: 'und',
      stock_actual: '',
      precio_directo: '',
      precio_publico: '',
      imagen_url: '',
      modelo_3d: '',
      url_referencia: '',
      proveedor_id: '',
      categoria_comercial: 'Comercial'
    });
  };

  const openDialog = (record?: RecordItem<CatalogRecord>) => {
    if (record) {
      setEditingId(record.id);
      setForm({
        sku: record.sku || '',
        tipo: record.tipo || 'Insumo',
        descripcion: record.descripcion || '',
        unidad_medida: record.unidad_medida || 'und',
        stock_actual: String(record.stock_actual ?? ''),
        precio_directo: String(record.precio_directo ?? ''),
        precio_publico: String(record.precio_publico ?? ''),
        imagen_url: record.imagen_url || '',
        modelo_3d: record.modelo_3d || '',
        url_referencia: record.url_referencia || '',
        proveedor_id: record.proveedor_id || '',
        categoria_comercial: record.categoria_comercial || 'Comercial'
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.descripcion.trim()) {
      toast.error('La descripcion es obligatoria.');
      return;
    }

    try {
      await writeRecord('productos_catalogo', editingId || crypto.randomUUID(), {
        sku: form.sku.trim(),
        tipo: form.tipo,
        descripcion: form.descripcion.trim(),
        unidad_medida: form.unidad_medida,
        stock_actual: Number(form.stock_actual) || 0,
        precio_directo: Number(form.precio_directo) || 0,
        precio_publico: Number(form.precio_publico) || 0,
        imagen_url: form.imagen_url.trim(),
        modelo_3d: form.modelo_3d.trim(),
        url_referencia: form.url_referencia.trim(),
        proveedor_id: form.proveedor_id || '',
        categoria_comercial: form.categoria_comercial
      });
      toast.success(editingId ? 'Producto del catalogo actualizado.' : 'Producto del catalogo creado.');
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch {
      toast.error('No se pudo guardar el catalogo.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeRecord('productos_catalogo', id);
      toast.success('Producto eliminado.');
      await loadData();
    } catch {
      toast.error('No se pudo eliminar el producto.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`px-4 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'catalogo'
              ? 'border-b-2 border-stone-950 text-stone-950'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Catálogo Maestro
        </button>
        <button
          onClick={() => setActiveTab('modulos')}
          className={`px-4 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'modulos'
              ? 'border-b-2 border-stone-950 text-stone-950'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Módulos y Productos
        </button>
      </div>

      {activeTab === 'catalogo' && (
      <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">Catalogo maestro</p>
          <h2 className="mt-1 text-2xl font-black text-stone-950">Insumos, servicios y referencias</h2>
          <p className="mt-2 text-sm text-stone-600">Administracion de SKU, precios y proveedor preferido desde un solo lugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo item
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3">
        <Search className="h-4 w-4 text-stone-500" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por SKU, descripcion o proveedor"
          className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          Cargando catalogo...
        </div>
      ) : filteredCatalogo.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No hay items en el catalogo.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredCatalogo.map((item) => (
            <Card key={item.id} className="border-stone-200">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{item.descripcion || 'Sin descripcion'}</CardTitle>
                  <p className="mt-1 text-xs text-stone-500">{item.sku || 'Sin SKU'}</p>
                </div>
                <Package className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoBlock label="Tipo" value={item.tipo || '-'} />
                  <InfoBlock label="Unidad" value={item.unidad_medida || '-'} />
                  <InfoBlock label="Stock" value={String(item.stock_actual ?? 0)} />
                  <InfoBlock label="Categoria" value={item.categoria_comercial || '-'} />
                  <InfoBlock label="Costo directo" value={currency(item.precio_directo)} />
                  <InfoBlock label="Precio publico" value={currency(item.precio_publico)} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoBlock label="Proveedor" value={providersById[item.proveedor_id || ''] || 'Sin proveedor'} />
                  <InfoBlock label="3D" value={item.modelo_3d || '-'} />
                </div>

                {item.url_referencia ? (
                  <a className="block truncate text-xs font-semibold text-sky-700 hover:text-sky-600" href={item.url_referencia} target="_blank" rel="noreferrer">
                    {item.url_referencia}
                  </a>
                ) : null}

                {item.imagen_url ? (
                  <div className="overflow-hidden rounded-md border border-stone-200 bg-stone-50 p-2">
                    <img src={item.imagen_url} alt={item.descripcion || 'Catalogo'} className="max-h-40 w-full object-cover" />
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openDialog(item)}>
                    <Pencil className="h-4 w-4" />
                    Editar
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">
              {editingId ? 'Editar item' : 'Nuevo item'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="SKU">
              <Input value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} />
            </Field>
            <Field label="Tipo">
              <Select value={form.tipo} onValueChange={(value) => setForm((current) => ({ ...current, tipo: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {types.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Descripcion">
                <Textarea value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} />
              </Field>
            </div>
            <Field label="Unidad de medida">
              <Select value={form.unidad_medida} onValueChange={(value) => setForm((current) => ({ ...current, unidad_medida: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Categoria comercial">
              <Select value={form.categoria_comercial} onValueChange={(value) => setForm((current) => ({ ...current, categoria_comercial: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Stock actual">
              <Input type="number" value={form.stock_actual} onChange={(event) => setForm((current) => ({ ...current, stock_actual: event.target.value }))} />
            </Field>
            <Field label="Proveedor">
              <Select value={form.proveedor_id} onValueChange={(value) => setForm((current) => ({ ...current, proveedor_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {proveedores.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.nombre || 'Proveedor'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="sm" className="mt-1 h-8 px-2 text-xs" onClick={() => setForm((current) => ({ ...current, proveedor_id: '' }))}>
                Sin proveedor
              </Button>
            </Field>
            <Field label="Precio directo">
              <Input type="number" value={form.precio_directo} onChange={(event) => setForm((current) => ({ ...current, precio_directo: event.target.value }))} />
            </Field>
            <Field label="Precio publico">
              <Input type="number" value={form.precio_publico} onChange={(event) => setForm((current) => ({ ...current, precio_publico: event.target.value }))} />
            </Field>
            <Field label="Imagen URL">
              <Input value={form.imagen_url} onChange={(event) => setForm((current) => ({ ...current, imagen_url: event.target.value }))} />
            </Field>
            <Field label="Modelo 3D">
              <Input value={form.modelo_3d} onChange={(event) => setForm((current) => ({ ...current, modelo_3d: event.target.value }))} />
            </Field>
            <div className="md:col-span-2">
              <Field label="URL de referencia">
                <Input value={form.url_referencia} onChange={(event) => setForm((current) => ({ ...current, url_referencia: event.target.value }))} />
              </Field>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      )}

      {activeTab === 'modulos' && (
        <PrefabricadosComposer />
      )}
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
