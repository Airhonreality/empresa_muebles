'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock3, Pencil, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type EquipoRecord = {
  nombre?: string;
  email?: string;
  rol?: string;
  estado?: string;
  descripcion_semantica?: string;
  costo_hora?: number;
  horas_estimadas_mes?: number;
  telefono?: string;
  firma_url?: string;
};

type RegistroHorasRecord = {
  fecha?: string;
  usuario_id?: string;
  proyecto_id?: string;
  horas_ordinarias?: number;
  horas_extras?: number;
  descripcion_semantica?: string;
  estado_pago?: string;
};

type NamedRecord = {
  nombre?: string;
  nombre_proyecto?: string;
  descripcion?: string;
  email?: string;
};

const roles = ['Taller', 'Instalacion', 'Comercial', 'Administracion', 'Direccion'];
const estados = ['activo', 'inactivo'];
const pagoEstados = ['pendiente', 'asentado', 'pagado'];

const today = () => new Date().toISOString().slice(0, 10);

const currency = (value: unknown) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

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

export default function EquipoDirectory() {
  const [usuarios, setUsuarios] = useState<RecordItem<EquipoRecord>[]>([]);
  const [horas, setHoras] = useState<RecordItem<RegistroHorasRecord>[]>([]);
  const [proyectos, setProyectos] = useState<RecordItem<NamedRecord>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('equipo');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState('');

  const [userForm, setUserForm] = useState({
    nombre: '',
    email: '',
    rol: 'Taller',
    estado: 'activo',
    telefono: '',
    costo_hora: '',
    horas_estimadas_mes: '',
    firma_url: '',
    descripcion_semantica: ''
  });

  const [hoursForm, setHoursForm] = useState({
    fecha: today(),
    usuario_id: '',
    proyecto_id: '',
    horas_ordinarias: '0',
    horas_extras: '0',
    estado_pago: 'pendiente',
    descripcion_semantica: ''
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextUsuarios, nextHoras, nextProyectos] = await Promise.all([
        fetch('/api/vault?namespace=usuarios_equipo', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vault?namespace=registro_horas', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vault?namespace=proyectos', { cache: 'no-store' }).then((r) => r.json())
      ]);

      setUsuarios(normalizeRecords<EquipoRecord>(nextUsuarios));
      setHoras(normalizeRecords<RegistroHorasRecord>(nextHoras));
      setProyectos(normalizeRecords<NamedRecord>(nextProyectos));
    } catch {
      toast.error('No se pudo cargar el modulo de equipo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const projectsById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const proyecto of proyectos) {
      map[proyecto.id] = proyecto.nombre_proyecto || proyecto.nombre || proyecto.descripcion || 'Proyecto';
    }
    return map;
  }, [proyectos]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return usuarios
      .filter((user) => {
        if (!term) return true;
        return [user.nombre, user.email, user.rol, user.telefono]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));
  }, [search, usuarios]);

  const recentHours = useMemo(
    () =>
      [...horas].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))).slice(0, 12),
    [horas]
  );

  const resetUserForm = () => {
    setEditingUserId('');
    setUserForm({
      nombre: '',
      email: '',
      rol: 'Taller',
      estado: 'activo',
      telefono: '',
      costo_hora: '',
      horas_estimadas_mes: '',
      firma_url: '',
      descripcion_semantica: ''
    });
  };

  const openUserDialog = (record?: RecordItem<EquipoRecord>) => {
    if (record) {
      setEditingUserId(record.id);
      setUserForm({
        nombre: record.nombre || '',
        email: record.email || '',
        rol: record.rol || 'Taller',
        estado: record.estado || 'activo',
        telefono: record.telefono || '',
        costo_hora: String(record.costo_hora ?? ''),
        horas_estimadas_mes: String(record.horas_estimadas_mes ?? ''),
        firma_url: record.firma_url || '',
        descripcion_semantica: record.descripcion_semantica || ''
      });
    } else {
      resetUserForm();
    }
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.nombre.trim()) {
      toast.error('El nombre es obligatorio.');
      return;
    }

    try {
      await writeRecord('usuarios_equipo', editingUserId || crypto.randomUUID(), {
        nombre: userForm.nombre.trim(),
        email: userForm.email.trim(),
        rol: userForm.rol,
        estado: userForm.estado,
        telefono: userForm.telefono.trim(),
        costo_hora: Number(userForm.costo_hora) || 0,
        horas_estimadas_mes: Number(userForm.horas_estimadas_mes) || 0,
        firma_url: userForm.firma_url.trim(),
        descripcion_semantica: userForm.descripcion_semantica.trim()
      });
      toast.success(editingUserId ? 'Integrante actualizado.' : 'Integrante creado.');
      setUserDialogOpen(false);
      resetUserForm();
      await loadData();
    } catch {
      toast.error('No se pudo guardar el integrante.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await removeRecord('usuarios_equipo', id);
      toast.success('Integrante eliminado.');
      if (editingUserId === id) {
        setUserDialogOpen(false);
        resetUserForm();
      }
      await loadData();
    } catch {
      toast.error('No se pudo eliminar el integrante.');
    }
  };

  const handleSaveHours = async () => {
    if (!hoursForm.usuario_id) {
      toast.error('Selecciona un integrante.');
      return;
    }
    try {
      await writeRecord('registro_horas', crypto.randomUUID(), {
        fecha: hoursForm.fecha || today(),
        usuario_id: hoursForm.usuario_id,
        proyecto_id: hoursForm.proyecto_id || '',
        horas_ordinarias: Number(hoursForm.horas_ordinarias) || 0,
        horas_extras: Number(hoursForm.horas_extras) || 0,
        estado_pago: hoursForm.estado_pago,
        descripcion_semantica: hoursForm.descripcion_semantica.trim()
      });
      toast.success('Registro de horas guardado.');
      setHoursDialogOpen(false);
      setHoursForm({
        fecha: today(),
        usuario_id: '',
        proyecto_id: '',
        horas_ordinarias: '0',
        horas_extras: '0',
        estado_pago: 'pendiente',
        descripcion_semantica: ''
      });
      await loadData();
    } catch {
      toast.error('No se pudo guardar el registro de horas.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">Gestion de equipo</p>
          <h2 className="mt-1 text-2xl font-black text-stone-950">Directorio, costos y horas</h2>
          <p className="mt-2 text-sm text-stone-600">Base operativa para operarios, costos por hora y trazabilidad de trabajo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button onClick={() => openUserDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo integrante
          </Button>
          <Button variant="secondary" onClick={() => setHoursDialogOpen(true)} className="gap-2">
            <Clock3 className="h-4 w-4" />
            Registrar horas
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-stone-100">
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="horas">Horas</TabsTrigger>
        </TabsList>

        <TabsContent value="equipo" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-stone-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo, rol o telefono"
              className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
              Cargando integrantes...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
              No hay integrantes registrados.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-stone-200">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-base">{user.nombre || 'Sin nombre'}</CardTitle>
                      <p className="mt-1 text-xs text-stone-500">{user.email || 'Sin correo'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-widest text-stone-500">{user.estado || 'activo'}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Rol</p>
                        <p className="mt-1 font-semibold text-stone-950">{user.rol || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Costo hora</p>
                        <p className="mt-1 font-semibold text-stone-950">{currency(user.costo_hora)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Telefono</p>
                        <p className="mt-1 font-semibold text-stone-950">{user.telefono || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Horas mes</p>
                        <p className="mt-1 font-semibold text-stone-950">{Number(user.horas_estimadas_mes || 0).toLocaleString('es-CO')}</p>
                      </div>
                    </div>

                    {user.descripcion_semantica ? (
                      <p className="rounded-md bg-stone-50 px-3 py-2 text-xs leading-6 text-stone-600">{user.descripcion_semantica}</p>
                    ) : null}

                    {user.firma_url ? (
                      <div className="overflow-hidden rounded-md border border-stone-200 bg-stone-50 p-2">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-stone-500">Firma</p>
                        <img src={user.firma_url} alt={`Firma de ${user.nombre || 'integrante'}`} className="max-h-24 w-auto" />
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openUserDialog(user)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2 text-rose-700" onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="horas" className="mt-4 space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-stone-500">Registro reciente</p>
                <h3 className="mt-1 text-lg font-black text-stone-950">{recentHours.length} entradas</h3>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => setHoursDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Nueva hora
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {recentHours.length === 0 ? (
                <div className="rounded-md border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                  Aun no hay registros de horas.
                </div>
              ) : (
                recentHours.map((entry) => {
                  const user = usuarios.find((item) => item.id === entry.usuario_id);
                  return (
                    <div key={entry.id} className="flex flex-col gap-2 rounded-lg border border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-stone-950">{user?.nombre || 'Sin integrante'}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {entry.fecha || 'sin fecha'} {entry.proyecto_id ? `· ${projectsById[entry.proyecto_id] || 'Proyecto'}` : ''}
                        </p>
                        {entry.descripcion_semantica ? (
                          <p className="mt-2 text-xs leading-6 text-stone-600">{entry.descripcion_semantica}</p>
                        ) : null}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-mono text-lg font-black text-stone-950">
                          {(Number(entry.horas_ordinarias || 0) + Number(entry.horas_extras || 0)).toLocaleString('es-CO', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                          })} h
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Pago: {entry.estado_pago || 'pendiente'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={userDialogOpen} onOpenChange={(open) => { setUserDialogOpen(open); if (!open) resetUserForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">
              {editingUserId ? 'Editar integrante' : 'Nuevo integrante'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre">
              <Input value={userForm.nombre} onChange={(event) => setUserForm((current) => ({ ...current, nombre: event.target.value }))} />
            </Field>
            <Field label="Correo">
              <Input value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
            </Field>
            <Field label="Rol">
              <Select value={userForm.rol} onValueChange={(value) => setUserForm((current) => ({ ...current, rol: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado">
              <Select value={userForm.estado} onValueChange={(value) => setUserForm((current) => ({ ...current, estado: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Telefono">
              <Input value={userForm.telefono} onChange={(event) => setUserForm((current) => ({ ...current, telefono: event.target.value }))} />
            </Field>
            <Field label="Costo hora">
              <Input type="number" value={userForm.costo_hora} onChange={(event) => setUserForm((current) => ({ ...current, costo_hora: event.target.value }))} />
            </Field>
            <Field label="Horas estimadas mes">
              <Input type="number" value={userForm.horas_estimadas_mes} onChange={(event) => setUserForm((current) => ({ ...current, horas_estimadas_mes: event.target.value }))} />
            </Field>
            <Field label="Firma URL">
              <Input value={userForm.firma_url} onChange={(event) => setUserForm((current) => ({ ...current, firma_url: event.target.value }))} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Descripcion semantica">
                <Textarea
                  value={userForm.descripcion_semantica}
                  onChange={(event) => setUserForm((current) => ({ ...current, descripcion_semantica: event.target.value }))}
                  placeholder="Notas del integrante, alcance o historia operativa"
                />
              </Field>
            </div>
          </div>

          {userForm.firma_url ? (
            <div className="overflow-hidden rounded-md border border-stone-200 bg-stone-50 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-stone-500">Vista previa de firma</p>
              <img src={userForm.firma_url} alt="Vista previa de firma" className="max-h-28 w-auto" />
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveUser}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">Registrar horas</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Fecha">
              <Input type="date" value={hoursForm.fecha} onChange={(event) => setHoursForm((current) => ({ ...current, fecha: event.target.value }))} />
            </Field>
            <Field label="Integrante">
              <Select value={hoursForm.usuario_id} onValueChange={(value) => setHoursForm((current) => ({ ...current, usuario_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {usuarios.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nombre || 'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Proyecto">
              <Select value={hoursForm.proyecto_id} onValueChange={(value) => setHoursForm((current) => ({ ...current, proyecto_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {proyectos.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.nombre_proyecto || project.nombre || 'Proyecto'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="sm" className="mt-1 h-8 px-2 text-xs" onClick={() => setHoursForm((current) => ({ ...current, proyecto_id: '' }))}>
                Sin proyecto
              </Button>
            </Field>
            <Field label="Estado pago">
              <Select value={hoursForm.estado_pago} onValueChange={(value) => setHoursForm((current) => ({ ...current, estado_pago: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {pagoEstados.map((estado) => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Horas ordinarias">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={hoursForm.horas_ordinarias}
                onChange={(event) => setHoursForm((current) => ({ ...current, horas_ordinarias: event.target.value }))}
              />
            </Field>
            <Field label="Horas extras">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={hoursForm.horas_extras}
                onChange={(event) => setHoursForm((current) => ({ ...current, horas_extras: event.target.value }))}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Descripcion semantica">
                <Textarea
                  value={hoursForm.descripcion_semantica}
                  onChange={(event) => setHoursForm((current) => ({ ...current, descripcion_semantica: event.target.value }))}
                  placeholder="Ej: apoyo en corte, armado, instalacion o tarea puntual"
                />
              </Field>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setHoursDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveHours}>Registrar</Button>
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
