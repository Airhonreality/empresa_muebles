'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pencil, RefreshCw, Shield, PenTool, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type UserRecord = {
  nombre?: string;
  email?: string;
  rol?: string;
  estado?: string;
  telefono?: string;
  costo_hora?: number;
  horas_estimadas_mes?: number;
  firma_url?: string;
  descripcion_semantica?: string;
};

const roles = ['Taller', 'Instalacion', 'Comercial', 'Administracion', 'Direccion'];
const estados = ['activo', 'inactivo'];

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

const currency = (value: unknown) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

export default function UserProfile() {
  const { user, isLoading } = useAuth();
  const [records, setRecords] = useState<RecordItem<UserRecord>[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rol: 'Comercial',
    estado: 'activo',
    telefono: '',
    costo_hora: '',
    horas_estimadas_mes: '',
    firma_url: '',
    descripcion_semantica: ''
  });

  const loadData = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const response = await fetch('/api/vault?namespace=usuarios_equipo', { cache: 'no-store' }).then((r) => r.json());
      setRecords(normalizeRecords<UserRecord>(response));
    } catch {
      toast.error('No se pudo cargar el perfil.');
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const profileRecord = useMemo(() => {
    if (!user) return null;
    const lowerEmail = user.email?.toLowerCase() || '';
    return records.find((record) => {
      const recordEmail = String(record.email || '').toLowerCase();
      return record.id === user.id || (!!lowerEmail && recordEmail === lowerEmail);
    }) || null;
  }, [records, user]);

  useEffect(() => {
    if (!user) return;
    setForm({
      nombre: profileRecord?.nombre || user.name || '',
      email: profileRecord?.email || user.email || '',
      rol: profileRecord?.rol || user.role || 'Comercial',
      estado: profileRecord?.estado || 'activo',
      telefono: profileRecord?.telefono || '',
      costo_hora: String(profileRecord?.costo_hora ?? ''),
      horas_estimadas_mes: String(profileRecord?.horas_estimadas_mes ?? ''),
      firma_url: profileRecord?.firma_url || '',
      descripcion_semantica: profileRecord?.descripcion_semantica || ''
    });
  }, [profileRecord, user]);

  const handleSave = async () => {
    if (!user) {
      toast.error('Debes iniciar sesion primero.');
      return;
    }

    setIsSaving(true);
    try {
      await writeRecord('usuarios_equipo', profileRecord?.id || user.id || crypto.randomUUID(), {
        nombre: form.nombre.trim() || user.name || form.email.trim(),
        email: form.email.trim() || user.email,
        rol: form.rol,
        estado: form.estado,
        telefono: form.telefono.trim(),
        costo_hora: Number(form.costo_hora) || 0,
        horas_estimadas_mes: Number(form.horas_estimadas_mes) || 0,
        firma_url: form.firma_url.trim(),
        descripcion_semantica: form.descripcion_semantica.trim()
      });
      toast.success('Perfil actualizado.');
      await loadData();
    } catch {
      toast.error('No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || loadingRecords) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
        Cargando perfil...
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="border-stone-200">
        <CardContent className="p-6 text-center">
          <Shield className="mx-auto h-10 w-10 text-stone-400" />
          <h2 className="mt-3 text-lg font-black text-stone-950">Sesion requerida</h2>
          <p className="mt-2 text-sm text-stone-600">Este modulo usa la cuenta autenticada para guardar firma y datos de contacto.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">Mi cuenta</p>
          <h2 className="mt-1 text-2xl font-black text-stone-950">Perfil y firma</h2>
          <p className="mt-2 text-sm text-stone-600">Datos del asesor o integrante autenticado que salen en PDF y documentos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Recargar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-base">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre">
              <Input value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
            </Field>
            <Field label="Correo">
              <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </Field>
            <Field label="Rol">
              <Select value={form.rol} onValueChange={(value) => setForm((current) => ({ ...current, rol: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado">
              <Select value={form.estado} onValueChange={(value) => setForm((current) => ({ ...current, estado: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Telefono">
              <Input value={form.telefono} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} />
            </Field>
            <Field label="Costo hora">
              <Input type="number" value={form.costo_hora} onChange={(event) => setForm((current) => ({ ...current, costo_hora: event.target.value }))} />
            </Field>
            <Field label="Horas estimadas mes">
              <Input type="number" value={form.horas_estimadas_mes} onChange={(event) => setForm((current) => ({ ...current, horas_estimadas_mes: event.target.value }))} />
            </Field>
            <Field label="Firma URL">
              <Input value={form.firma_url} onChange={(event) => setForm((current) => ({ ...current, firma_url: event.target.value }))} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Descripcion semantica">
                <Textarea
                  value={form.descripcion_semantica}
                  onChange={(event) => setForm((current) => ({ ...current, descripcion_semantica: event.target.value }))}
                  placeholder="Notas que deban imprimirse o quedar asociadas al perfil"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-base">Sesion y firma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-stone-800 shadow-sm">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-stone-950">{user.name || form.nombre || 'Sin nombre'}</p>
                  <p className="text-xs text-stone-500">{user.email || form.email}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Rol en sesion</p>
                  <p className="mt-1 font-semibold text-stone-950">{user.role}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Costo hora</p>
                  <p className="mt-1 font-semibold text-stone-950">{currency(form.costo_hora)}</p>
                </div>
              </div>
            </div>

            {form.firma_url ? (
              <div className="overflow-hidden rounded-lg border border-stone-200 bg-white p-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-stone-500">Vista previa firma</p>
                <img src={form.firma_url} alt="Firma del usuario" className="max-h-36 w-auto" />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
                <PenTool className="mx-auto h-8 w-8 text-stone-400" />
                <p className="mt-2">Aun no hay firma registrada.</p>
              </div>
            )}

            {profileRecord ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-black uppercase tracking-widest text-[10px]">Registro asociado</p>
                <p className="mt-2">{profileRecord.nombre || profileRecord.email || profileRecord.id}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-black uppercase tracking-widest text-[10px]">Sin registro previo</p>
                <p className="mt-2">Al guardar se creara el registro de `usuarios_equipo` asociado a tu sesion.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
