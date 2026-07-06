'use client';

import React, { useMemo, useState } from 'react';
import type { BlockProps } from '@agnostic/core';
import { CalendarDays, Clock3, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
  created_at?: string;
} & T;

type TaskRecord = {
  titulo?: string;
  descripcion?: string;
  proyecto_id?: string;
  departamento?: string;
  estado?: string;
  fase_kanban?: string;
  fecha_limite?: string;
  asignado_a?: string;
};

type ProjectRecord = {
  nombre_proyecto?: string;
  nombre?: string;
  descripcion?: string;
};

type UserRecord = {
  nombre?: string;
  rol?: string;
};

const TODAY = toDateKey(new Date());

const doneStates = new Set(['completado', 'completada', 'hecho', 'done', 'finalizado', 'finalizada', 'cancelado', 'anulado']);

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

function toDateKey(date: Date | string | null | undefined) {
  if (!date) return '';
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return '';
    return trimmed.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfWeek(dateKey: string) {
  const date = parseDate(dateKey) || new Date();
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  return monday;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function formatDayLabel(dateKey: string) {
  const date = parseDate(dateKey);
  if (!date) return dateKey || 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(date);
}

function formatLongDate(dateKey: string) {
  const date = parseDate(dateKey);
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function compareDateKeys(a: string, b: string) {
  return a.localeCompare(b);
}

export default function CalendarScheduler({ block, records }: Partial<BlockProps>) {
  const context = (block?.context as string) || 'tareas_operativas';
  const { data: fallbackTasks } = useRelationData(context);
  const { data: proyectosData } = useRelationData('proyectos');
  const { data: usuariosData } = useRelationData('usuarios_equipo');

  const taskRecords = useMemo(() => {
    const source = Array.isArray(records) && records.length > 0 ? records : fallbackTasks;
    return normalizeRecords<TaskRecord>(source);
  }, [fallbackTasks, records]);

  const projectRecords = useMemo(() => normalizeRecords<ProjectRecord>(proyectosData), [proyectosData]);
  const userRecords = useMemo(() => normalizeRecords<UserRecord>(usuariosData), [usuariosData]);

  const [department, setDepartment] = useState('Todos');
  const [view, setView] = useState<'agenda' | 'week' | 'day'>('agenda');
  const [focusDate, setFocusDate] = useState(TODAY);

  const departments = useMemo(() => {
    const values = new Set<string>();
    taskRecords.forEach((task) => {
      const value = String(task.departamento || '').trim();
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [taskRecords]);

  const tasks = useMemo(() => {
    return [...taskRecords]
      .filter((task) => {
        if (department === 'Todos') return true;
        return String(task.departamento || '') === department;
      })
      .sort((a, b) => compareDateKeys(String(a.fecha_limite || ''), String(b.fecha_limite || '')));
  }, [department, taskRecords]);

  const projectById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of projectRecords) {
      map[project.id] = project.nombre_proyecto || project.nombre || project.descripcion || 'Proyecto';
    }
    return map;
  }, [projectRecords]);

  const userById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const user of userRecords) {
      map[user.id] = user.nombre || user.rol || 'Integrante';
    }
    return map;
  }, [userRecords]);

  const selectedDayTasks = useMemo(
    () => tasks.filter((task) => toDateKey(task.fecha_limite) === focusDate),
    [focusDate, tasks]
  );

  const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => toDateKey(addDays(weekStart, index))),
    [weekStart]
  );

  const agendaTasks = useMemo(() => {
    const upcoming = tasks.filter((task) => {
      const key = toDateKey(task.fecha_limite);
      if (!key) return false;
      return key >= TODAY;
    });
    return upcoming.slice(0, 18);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter((task) => {
      const key = toDateKey(task.fecha_limite);
      if (!key || key >= TODAY) return false;
      const state = String(task.estado || '').toLowerCase();
      return !doneStates.has(state);
    });
  }, [tasks]);

  const todayTasks = useMemo(
    () => tasks.filter((task) => toDateKey(task.fecha_limite) === TODAY),
    [tasks]
  );

  const focusLabel = useMemo(() => formatLongDate(focusDate), [focusDate]);

  const refreshPage = () => {
    window.location.reload();
  };

  const summary = [
    { label: 'Tareas', value: tasks.length.toLocaleString('es-CO') },
    { label: 'Hoy', value: todayTasks.length.toLocaleString('es-CO') },
    { label: 'Atrasadas', value: overdueTasks.length.toLocaleString('es-CO') },
    { label: 'Departamentos', value: departments.length.toLocaleString('es-CO') }
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-stone-600">
              <CalendarDays className="h-3.5 w-3.5" />
              Calendario operativo
            </div>
            <h2 className="text-2xl font-black tracking-tight text-stone-950">Scheduler del fork sobre tareas operativas</h2>
            <p className="max-w-2xl text-sm leading-6 text-stone-600">
              Vista liviana para agenda, semanal y diario, con filtro por departamento y lectura directa de
              <span className="font-semibold text-stone-800"> tareas_operativas</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={refreshPage} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Recargar
            </Button>
            <div className="min-w-[220px]">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="bg-white">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-stone-500" />
                    <SelectValue placeholder="Filtrar por departamento" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos los departamentos</SelectItem>
                  {departments.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <Card key={item.label} className="border-stone-200 bg-stone-50/50">
              <CardContent className="p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-stone-950">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs value={view} onValueChange={(value) => setView(value as 'agenda' | 'week' | 'day')} className="w-full">
        <TabsList className="bg-stone-100">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="week">Semanal</TabsTrigger>
          <TabsTrigger value="day">Diario</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <Card className="border-stone-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Próximas tareas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agendaTasks.length === 0 ? (
                  <EmptyState text="No hay tareas próximas en esta vista." />
                ) : (
                  agendaTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectLabel={projectById[String(task.proyecto_id || '')]}
                      userLabel={userById[String(task.asignado_a || '')]}
                      compact={false}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-stone-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estado del foco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">Fecha activa</p>
                  <p className="mt-2 text-lg font-black text-stone-950">{focusLabel}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-stone-600">
                    <Clock3 className="h-4 w-4" />
                    {selectedDayTasks.length} tarea(s) en esta fecha
                  </div>
                </div>
                <div className="space-y-2">
                  {todayTasks.slice(0, 5).map((task) => (
                    <TaskMini key={task.id} task={task} />
                  ))}
                  {todayTasks.length === 0 ? <EmptyState text="No hay tareas para hoy." /> : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <div className="grid gap-3 lg:grid-cols-7">
            {weekDays.map((dateKey) => {
              const dayTasks = tasks.filter((task) => toDateKey(task.fecha_limite) === dateKey);
              const isSelected = dateKey === focusDate;
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setFocusDate(dateKey)}
                  className={`flex min-h-[240px] flex-col rounded-2xl border p-3 text-left transition ${
                    isSelected ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {formatDayLabel(dateKey)}
                      </p>
                      <p className={`mt-2 text-lg font-black ${isSelected ? 'text-white' : 'text-stone-950'}`}>
                        {dayTasks.length}
                      </p>
                    </div>
                    {dateKey === TODAY ? (
                      <Badge variant="secondary" className={isSelected ? 'bg-white text-stone-950' : ''}>
                        Hoy
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-2">
                    {dayTasks.slice(0, 3).map((task) => (
                      <TaskMini key={task.id} task={task} compact isDark={isSelected} />
                    ))}
                    {dayTasks.length === 0 ? (
                      <p className={`rounded-lg border border-dashed p-3 text-xs ${isSelected ? 'border-stone-700 text-stone-300' : 'border-stone-200 text-stone-500'}`}>
                        Sin tareas
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="day" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <Card className="border-stone-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Fecha seleccionada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input type="date" value={focusDate} onChange={(event) => setFocusDate(event.target.value)} />
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">Detalle</p>
                  <p className="mt-2 text-lg font-black text-stone-950">{formatLongDate(focusDate)}</p>
                  <p className="mt-2 text-sm text-stone-600">{selectedDayTasks.length} tarea(s) programada(s).</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tareas del dia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDayTasks.length === 0 ? (
                  <EmptyState text="No hay tareas en la fecha seleccionada." />
                ) : (
                  selectedDayTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectLabel={projectById[String(task.proyecto_id || '')]}
                      userLabel={userById[String(task.asignado_a || '')]}
                      compact={false}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskCard({
  task,
  projectLabel,
  userLabel,
  compact,
}: {
  task: TaskRecord;
  projectLabel?: string;
  userLabel?: string;
  compact: boolean;
}) {
  const dateKey = toDateKey(task.fecha_limite);
  const overdue = dateKey && dateKey < TODAY && !doneStates.has(String(task.estado || '').toLowerCase());
  const dueToday = dateKey === TODAY;

  return (
    <div className={`rounded-xl border p-4 ${compact ? 'bg-white' : 'bg-stone-50/60'} ${overdue ? 'border-rose-300' : 'border-stone-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-stone-950">{task.titulo || task.descripcion || 'Tarea operativa'}</p>
          <p className="mt-1 text-xs text-stone-500">
            {dateKey ? formatDayLabel(dateKey) : 'Sin fecha'} {task.departamento ? `· ${task.departamento}` : ''}
          </p>
        </div>
        <Badge variant={overdue ? 'destructive' : dueToday ? 'secondary' : 'outline'}>
          {task.estado || 'pendiente'}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
        <Meta label="Proyecto" value={projectLabel || String(task.proyecto_id || 'Sin proyecto')} />
        <Meta label="Responsable" value={userLabel || String(task.asignado_a || 'Sin asignar')} />
      </div>

      {task.descripcion ? (
        <p className="mt-3 text-xs leading-6 text-stone-600">{task.descripcion}</p>
      ) : null}

      {task.fase_kanban ? (
        <div className="mt-3 inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-stone-600">
          {task.fase_kanban}
        </div>
      ) : null}
    </div>
  );
}

function TaskMini({ task, compact = false, isDark = false }: { task: TaskRecord; compact?: boolean; isDark?: boolean }) {
  const dateKey = toDateKey(task.fecha_limite);
  const overdue = dateKey && dateKey < TODAY && !doneStates.has(String(task.estado || '').toLowerCase());

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs ${
        isDark
          ? 'border-stone-700 bg-white/5 text-stone-100'
          : 'border-stone-200 bg-white text-stone-700'
      } ${overdue ? 'border-rose-300' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate font-semibold ${isDark ? 'text-white' : 'text-stone-950'}`}>
          {task.titulo || task.descripcion || 'Tarea'}
        </span>
        <span className={`shrink-0 text-[10px] uppercase tracking-[0.24em] ${isDark ? 'text-stone-300' : 'text-stone-500'}`}>
          {task.estado || 'pendiente'}
        </span>
      </div>
      {dateKey ? <p className={`mt-1 ${isDark ? 'text-stone-300' : 'text-stone-500'}`}>{formatDayLabel(dateKey)}</p> : null}
      {compact && task.departamento ? <p className={`mt-1 ${isDark ? 'text-stone-300' : 'text-stone-500'}`}>{task.departamento}</p> : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-5 text-center text-sm text-stone-500">
      {text}
    </div>
  );
}
