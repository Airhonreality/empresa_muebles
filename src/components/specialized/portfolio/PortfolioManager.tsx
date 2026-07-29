'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SeoImageUploader, type SeoImageData } from '@/components/ui/SeoImageUploader';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type ProyectoRecord = {
  titulo?: string;
  estado?: string;
  cliente_id?: string;
  barrio?: string;
  direccion_obra?: string;
  codigo?: string;
};

type ClienteRecord = {
  nombre?: string;
};

type EspacioVarianteRecord = {
  proyecto_id?: string;
  nombre_espacio?: string;
};

type ItemVarianteRecord = {
  variante_id?: string;
  catalogo_id?: string;
  cantidad?: number;
};

type ProductoCatalogoRecord = {
  sku?: string;
  descripcion?: string;
  precio_directo?: number;
};

type PortfolioPublicoRecord = {
  proyecto_id?: string;
  titulo?: string;
  slug?: string;
  descripcion_comercial?: string;
  cliente_iniciales?: string;
  barrio?: string;
  categoria_espacio?: string;
  materiales_destacados?: string;
  publicado?: boolean;
  destacado?: boolean;
  orden?: number;
  fecha_publicacion?: string;
};

type ImagenPortfolioRecord = {
  id?: string;
  portfolio_id?: string;
  imagen_url?: string;
  descripcion?: string;
  alt_text?: string;
  image_title?: string;
  keywords?: string;
  imagen_filename?: string;
  orden?: number;
  structured_data?: Record<string, unknown>;
};

const categorias = ['cocinas', 'cavas_bares', 'dormitorios_closets', 'consolas_recibidores', 'otros'];

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

async function readRecords(namespace: string) {
  const res = await fetch(`/api/vault?namespace=${encodeURIComponent(namespace)}`);
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  return normalizeRecords(body.records ?? body.data ?? []);
}

async function readRecordById<T>(namespace: string, id: string) {
  const records = await readRecords(namespace);
  return (records as RecordItem<T>[]).find(record => record.id === id) ?? null;
}

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

async function writeMergedRecord(namespace: string, id: string | undefined, data: Record<string, unknown>) {
  if (!id) return writeRecord(namespace, undefined, data);

  const existing = await readRecordById<Record<string, unknown>>(namespace, id);
  const currentData = existing?.data && typeof existing.data === 'object'
    ? (existing.data as Record<string, unknown>)
    : {};

  return writeRecord(namespace, id, { ...currentData, ...data });
}

async function removeRecord(namespace: string, id: string) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'REMOVE', namespace, id })
  });
  if (!res.ok) throw new Error(await res.text());
}

function extractInitials(nombre: string): string {
  return nombre
    ?.split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('.')
    .slice(0, 10) ?? '';
}

async function deriveMateriales(projectId: string): Promise<string[]> {
  try {
    const espacios = await readRecords('espacio_variantes');
    const proyectoEspacios = (espacios as RecordItem<EspacioVarianteRecord>[]).filter(
      e => e.proyecto_id === projectId
    );

    const materiales: Map<string, string> = new Map();

    for (const espacio of proyectoEspacios) {
      const items = await readRecords('items_variante');
      const espacioItems = (items as RecordItem<ItemVarianteRecord>[]).filter(
        i => i.variante_id === espacio.id
      );

      for (const item of espacioItems) {
        const catalogo = await readRecords('productos_catalogo');
        const producto = (catalogo as RecordItem<ProductoCatalogoRecord>[]).find(
          p => p.id === item.catalogo_id
        );

        if (producto?.sku && !producto.sku.startsWith('SERV-') && producto.descripcion) {
          materiales.set(producto.sku, producto.descripcion);
        }
      }
    }

    return Array.from(materiales.values());
  } catch (err) {
    console.error('Error deriving materiales:', err);
    return [];
  }
}

export default function PortfolioManager() {
  const [portfolios, setPortfolios] = useState<RecordItem<PortfolioPublicoRecord>[]>([]);
  const [proyectos, setProyectos] = useState<RecordItem<ProyectoRecord>[]>([]);
  const [clientes, setClientes] = useState<RecordItem<ClienteRecord>[]>([]);
  const [imagenes, setImagenes] = useState<RecordItem<ImagenPortfolioRecord>[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [form, setForm] = useState<PortfolioPublicoRecord>({
    titulo: '',
    slug: '',
    descripcion_comercial: '',
    cliente_iniciales: '',
    barrio: '',
    categoria_espacio: 'cocinas',
    materiales_destacados: '',
    publicado: false,
    destacado: false,
    orden: 0,
    fecha_publicacion: new Date().toISOString().split('T')[0]
  });
  const [imagenesList, setImagenesList] = useState<SeoImageData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [portData, proyData, clientData, imgData] = await Promise.all([
          readRecords('portfolio_publico'),
          readRecords('proyectos'),
          readRecords('clientes'),
          readRecords('imagenes_portfolio')
        ]);
        setPortfolios(portData as RecordItem<PortfolioPublicoRecord>[]);
        setProyectos(proyData as RecordItem<ProyectoRecord>[]);
        setClientes(clientData as RecordItem<ClienteRecord>[]);
        setImagenes(imgData as RecordItem<ImagenPortfolioRecord>[]);
      } catch (err) {
        toast.error(`Error loading data: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredPortfolios = useMemo(() => {
    return portfolios.filter(p =>
      (p.titulo?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (p.cliente_iniciales?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (p.barrio?.toLowerCase() ?? '').includes(search.toLowerCase())
    );
  }, [portfolios, search]);

  const handleSelectProyecto = useCallback(async (projectId: string) => {
    const proyecto = proyectos.find(p => p.id === projectId);
    if (!proyecto) return;

    const cliente = clientes.find(c => c.id === proyecto.cliente_id);
    const materiales = await deriveMateriales(projectId);

    setSelectedProyecto(projectId);
    setForm(prev => ({
      ...prev,
      proyecto_id: projectId,
      cliente_iniciales: cliente?.nombre ? extractInitials(cliente.nombre) : '',
      barrio: proyecto.barrio ?? '',
      materiales_destacados: materiales.join('\n')
    }));
  }, [proyectos, clientes]);

  const handleNew = useCallback(() => {
    setEditingId('');
    setSelectedProyecto('');
    setForm({
      titulo: '',
      slug: '',
      descripcion_comercial: '',
      cliente_iniciales: '',
      barrio: '',
      categoria_espacio: 'cocinas',
      materiales_destacados: '',
      publicado: false,
      destacado: false,
      orden: 0,
      fecha_publicacion: new Date().toISOString().split('T')[0]
    });
    setImagenesList([]);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((portfolio: RecordItem<PortfolioPublicoRecord>) => {
    setEditingId(portfolio.id);
    setSelectedProyecto(portfolio.proyecto_id ?? '');
    setForm({ ...portfolio });
    const relatedImages = imagenes.filter(img => img.portfolio_id === portfolio.id);
    setImagenesList(relatedImages.map(img => ({
      imagen_url: img.imagen_url || '',
      descripcion: img.descripcion,
      alt_text: img.alt_text,
      image_title: img.image_title,
      keywords: img.keywords,
      imagen_filename: img.imagen_filename,
      structured_data: img.structured_data,
    } as SeoImageData)));
    setDialogOpen(true);
  }, [imagenes]);

  const handleSave = async () => {
    if (!form.titulo || !form.slug || !form.categoria_espacio || !form.descripcion_comercial) {
      toast.error('Completa título, slug, categoría y descripción');
      return;
    }

    if (form.publicado && imagenesList.length === 0) {
      toast.error('Para publicar necesitas al menos una imagen');
      return;
    }

    try {
      const portfolioData = { ...form };
      const portfolio = (editingId
        ? await writeMergedRecord('portfolio_publico', editingId, portfolioData)
        : await writeRecord('portfolio_publico', undefined, portfolioData)) as RecordItem<PortfolioPublicoRecord>;

      const existingImages = (await readRecords('imagenes_portfolio'))
        .filter(img => (img as RecordItem<ImagenPortfolioRecord>).portfolio_id === portfolio.id) as RecordItem<ImagenPortfolioRecord>[];

      const nextUrls = new Set(
        imagenesList
          .map(img => img.imagen_url)
          .filter((value): value is string => Boolean(value))
      );
      const previousByUrl = new Map(
        existingImages
          .filter(img => img.imagen_url)
          .map(img => [img.imagen_url as string, img])
      );

      for (const image of existingImages) {
        if (!image.imagen_url || !nextUrls.has(image.imagen_url)) {
          await removeRecord('imagenes_portfolio', image.id);
        }
      }

      for (const [index, img] of imagenesList.entries()) {
        if (!img.imagen_url) continue;

        const payload: Record<string, unknown> = {
          portfolio_id: portfolio.id,
          imagen_url: img.imagen_url,
          descripcion: img.descripcion ?? '',
          alt_text: img.alt_text,
          image_title: img.image_title,
          keywords: img.keywords,
          imagen_filename: img.imagen_filename,
          orden: index,
        };
        if (img.structured_data) {
          payload.structured_data = img.structured_data;
        }

        const previous = previousByUrl.get(img.imagen_url);
        if (previous?.id) {
          await writeMergedRecord('imagenes_portfolio', previous.id, payload);
        } else {
          await writeRecord('imagenes_portfolio', undefined, payload);
        }
      }

      const [updatedPortfolios, updatedImages] = await Promise.all([
        readRecords('portfolio_publico'),
        readRecords('imagenes_portfolio')
      ]);
      setPortfolios(updatedPortfolios as RecordItem<PortfolioPublicoRecord>[]);
      setImagenes(updatedImages as RecordItem<ImagenPortfolioRecord>[]);

      toast.success(editingId ? 'Actualizado' : 'Creado');
      setDialogOpen(false);
    } catch (err) {
      toast.error(`Error saving: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este portafolio?')) return;
    try {
      await removeRecord('portfolio_publico', id);
      setPortfolios(portfolios.filter(p => p.id !== id));
      toast.success('Eliminado');
    } catch (err) {
      toast.error(`Error deleting: ${err}`);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Portafolio Público</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar..."
              className="w-40"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Button onClick={handleNew} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Cargando...</div>
          ) : filteredPortfolios.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Sin portafolios</div>
          ) : (
            <div className="space-y-2">
              {filteredPortfolios.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="font-semibold">{p.titulo}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.cliente_iniciales} — {p.barrio} | {p.categoria_espacio}
                      {p.publicado && ' ✓ Publicado'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Nuevo'} Portafolio</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Proyecto</label>
              <Select value={selectedProyecto} onValueChange={handleSelectProyecto}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona proyecto..." />
                </SelectTrigger>
                <SelectContent>
                  {proyectos.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.titulo} ({p.barrio})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Título</label>
                <Input
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Nombre del portafolio"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <Input
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="url-slug"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Descripción Comercial</label>
              <Textarea
                value={form.descripcion_comercial}
                onChange={e => setForm({ ...form, descripcion_comercial: e.target.value })}
                placeholder="Descripción detallada del proyecto"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Iniciales Cliente</label>
                <Input
                  value={form.cliente_iniciales}
                  onChange={e => setForm({ ...form, cliente_iniciales: e.target.value })}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Barrio</label>
                <Input
                  value={form.barrio}
                  onChange={e => setForm({ ...form, barrio: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Categoría</label>
                <Select value={form.categoria_espacio} onValueChange={val => setForm({ ...form, categoria_espacio: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Materiales Destacados</label>
              <Textarea
                value={form.materiales_destacados}
                onChange={e => setForm({ ...form, materiales_destacados: e.target.value })}
                placeholder="Un material por línea (sin precios)"
                rows={4}
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="text-sm font-semibold">Imágenes del Portafolio (con SEO)</div>
              <SeoImageUploader
                value={imagenesList}
                onChange={setImagenesList}
                spaceCategoryId={form.categoria_espacio}
                spaceName={form.titulo || 'Espacio'}
              />
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.publicado}
                  onCheckedChange={val => setForm({ ...form, publicado: !!val })}
                />
                <label className="text-sm">Publicar</label>
              </div>
              {form.publicado && imagenesList.length === 0 && (
                <div className="text-xs text-orange-600">Requiere al menos 1 imagen</div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.destacado}
                  onCheckedChange={val => setForm({ ...form, destacado: !!val })}
                />
                <label className="text-sm">Destacado</label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  value={form.orden}
                  onChange={e => setForm({ ...form, orden: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
