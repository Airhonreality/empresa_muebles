'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, RefreshCw, Search, Trash2, ChevronDown, Image } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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
  portfolio_id?: string;
  imagen_url?: string;
  descripcion?: string;
  orden?: number;
};

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
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'READ', namespace })
  });
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  return normalizeRecords(body.records ?? body.data ?? []);
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

const categorias = ['cocinas', 'cavas_bares', 'dormitorios_closets', 'consolas_recibidores', 'otros'];

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
  const [imagenesList, setImagenesList] = useState<Partial<ImagenPortfolioRecord>[]>([]);
  const [imageForm, setImageForm] = useState({ imagen_url: '', descripcion: '' });

  // Load data
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
      imagen_url: img.imagen_url,
      descripcion: img.descripcion,
      orden: img.orden
    })));
    setDialogOpen(true);
  }, [imagenes]);

  const handleSave = async () => {
    if (!form.titulo || !form.slug || !form.categoria_espacio) {
      toast.error('Completa al menos título, slug y categoría');
      return;
    }

    try {
      const portfolio = await writeRecord('portfolio_publico', editingId || undefined, form);

      // Save images
      for (const img of imagenesList) {
        if (img.imagen_url) {
          await writeRecord('imagenes_portfolio', undefined, {
            portfolio_id: portfolio.id,
            ...img
          });
        }
      }

      // Reload
      const updated = await readRecords('portfolio_publico');
      setPortfolios(updated as RecordItem<PortfolioPublicoRecord>[]);

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

  const handleAddImage = () => {
    if (!imageForm.imagen_url) {
      toast.error('Ingresa URL de imagen');
      return;
    }
    setImagenesList([
      ...imagenesList,
      {
        imagen_url: imageForm.imagen_url,
        descripcion: imageForm.descripcion,
        orden: imagenesList.length
      }
    ]);
    setImageForm({ imagen_url: '', descripcion: '' });
  };

  const handleRemoveImage = (idx: number) => {
    setImagenesList(imagenesList.filter((_, i) => i !== idx));
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
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredPortfolios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Sin portafolios</div>
          ) : (
            <div className="space-y-2">
              {filteredPortfolios.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{p.titulo}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.cliente_iniciales} — {p.barrio} | {p.categoria_espacio}
                      {p.publicado && ' ✓ Publicado'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Nuevo'} Portafolio</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proyecto</label>
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
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Nombre del portafolio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <Input
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="url-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción Comercial</label>
              <Textarea
                value={form.descripcion_comercial}
                onChange={e => setForm({ ...form, descripcion_comercial: e.target.value })}
                placeholder="Descripción detallada del proyecto"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Iniciales Cliente</label>
                <Input
                  value={form.cliente_iniciales}
                  onChange={e => setForm({ ...form, cliente_iniciales: e.target.value })}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Barrio</label>
                <Input
                  value={form.barrio}
                  onChange={e => setForm({ ...form, barrio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
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
              <label className="block text-sm font-medium mb-1">Materiales Destacados</label>
              <Textarea
                value={form.materiales_destacados}
                onChange={e => setForm({ ...form, materiales_destacados: e.target.value })}
                placeholder="Un material por línea (sin precios)"
                rows={4}
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="text-sm font-semibold">Imágenes del Portafolio</div>
              {imagenesList.length > 0 && (
                <div className="space-y-2">
                  {imagenesList.map((img, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="text-sm">
                        <Image className="w-4 h-4 inline mr-2" />
                        {img.descripcion || 'Sin descripción'}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveImage(idx)}>
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={imageForm.imagen_url}
                  onChange={e => setImageForm({ ...imageForm, imagen_url: e.target.value })}
                  placeholder="URL de imagen"
                />
                <Input
                  value={imageForm.descripcion}
                  onChange={e => setImageForm({ ...imageForm, descripcion: e.target.value })}
                  placeholder="Descripción"
                  className="flex-1"
                />
                <Button onClick={handleAddImage} size="sm">
                  Agregar
                </Button>
              </div>
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
                <label className="block text-sm font-medium mb-1">Orden</label>
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
