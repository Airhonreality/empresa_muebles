'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, RefreshCw, Store, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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

type ProveedorRecord = {
  nombre?: string;
  nit?: string;
  telefono?: string;
  direccion?: string;
  categoria?: string;
  descripcion_semantica?: string;
};

const categories = ['Madera', 'Herrajes', 'Piedras', 'Tapizados', 'Acabados', 'Servicios', 'Otro'];

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

export default function ProveedoresDirectory() {
  const [proveedores, setProveedores] = useState<RecordItem<ProveedorRecord>[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    telefono: '',
    direccion: '',
    categoria: 'Madera',
    descripcion_semantica: ''
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vault?namespace=proveedores', { cache: 'no-store' }).then((r) => r.json());
      setProveedores(normalizeRecords<ProveedorRecord>(response));
    } catch {
      toast.error('No se pudo cargar el directorio de proveedores.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProviders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...proveedores]
      .filter((provider) => {
        if (categoryFilter !== 'all' && String(provider.categoria || '') !== categoryFilter) return false;
        if (!term) return true;
        return [provider.nombre, provider.nit, provider.telefono, provider.direccion, provider.categoria]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
  }, [categoryFilter, proveedores, search]);

  const resetForm = () => {
    setEditingId('');
    setForm({
      nombre: '',
      nit: '',
      telefono: '',
      direccion: '',
      categoria: 'Madera',
      descripcion_semantica: ''
    });
  };

  const openDialog = (record?: RecordItem<ProveedorRecord>) => {
    if (record) {
      setEditingId(record.id);
      setForm({
        nombre: record.nombre || '',
        nit: record.nit || '',
        telefono: record.telefono || '',
        direccion: record.direccion || '',
        categoria: record.categoria || 'Madera',
        descripcion_semantica: record.descripcion_semantica || ''
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio.');
      return;
    }

    try {
      await writeRecord('proveedores', editingId || crypto.randomUUID(), {
        nombre: form.nombre.trim(),
        nit: form.nit.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        categoria: form.categoria,
        descripcion_semantica: form.descripcion_semantica.trim()
      });
      toast.success(editingId ? 'Proveedor actualizado.' : 'Proveedor creado.');
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch {
      toast.error('No se pudo guardar el proveedor.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeRecord('proveedores', id);
      toast.success('Proveedor eliminado.');
      await loadData();
    } catch {
      toast.error('No se pudo eliminar el proveedor.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-4 z-20 overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.07)] backdrop-blur">
        <CatalogCollectionChrome
          badges={(
            <>
              <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-900">
                <Store className="mr-1 h-3 w-3" />
                Proveedores
              </Badge>
              <Badge variant="outline" className="rounded-full border-stone-200 bg-stone-50 text-stone-700">
                {filteredProviders.length} activos
              </Badge>
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800">
                {proveedores.length} total
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
              label: 'Nuevo proveedor',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => openDialog(),
              variant: 'default',
            },
          ]}
          searchValue={search}
          searchPlaceholder="Buscar por nombre, NIT, telefono o categoria"
          onSearchChange={setSearch}
          filterValue={categoryFilter}
          filterPlaceholder="Categoria"
          onFilterChange={setCategoryFilter}
          filterOptions={[
            { value: 'all', label: 'Todas' },
            ...categories.map((category) => ({ value: category, label: category })),
          ]}
        />
      </div>

      {isLoading ? (
        <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          Cargando proveedores...
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No hay proveedores registrados.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="border-stone-200">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{provider.nombre || 'Sin nombre'}</CardTitle>
                  <p className="mt-1 text-xs text-stone-500">{provider.nit || 'Sin NIT'}</p>
                </div>
                <Store className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <div className="px-6 pb-2">
                <div className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-stone-600">
                  {provider.categoria || 'Otro'}
                </div>
              </div>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Telefono</p>
                    <p className="mt-1 font-semibold text-stone-950">{provider.telefono || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Direccion</p>
                    <p className="mt-1 font-semibold text-stone-950">{provider.direccion || '-'}</p>
                  </div>
                </div>

                {provider.descripcion_semantica ? (
                  <p className="rounded-md bg-stone-50 px-3 py-2 text-xs leading-6 text-stone-600">{provider.descripcion_semantica}</p>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openDialog(provider)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 text-rose-700" onClick={() => handleDelete(provider.id)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">
              {editingId ? 'Editar proveedor' : 'Nuevo proveedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre">
              <Input value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
            </Field>
            <Field label="NIT">
              <Input value={form.nit} onChange={(event) => setForm((current) => ({ ...current, nit: event.target.value }))} />
            </Field>
            <Field label="Telefono">
              <Input value={form.telefono} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} />
            </Field>
            <Field label="Categoria">
              <Select value={form.categoria} onValueChange={(value) => setForm((current) => ({ ...current, categoria: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Direccion">
                <Input value={form.direccion} onChange={(event) => setForm((current) => ({ ...current, direccion: event.target.value }))} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Descripcion semantica">
                <Textarea
                  value={form.descripcion_semantica}
                  onChange={(event) => setForm((current) => ({ ...current, descripcion_semantica: event.target.value }))}
                  placeholder="Notas de compra, entregas, condiciones o historial"
                />
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
