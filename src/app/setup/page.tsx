'use client';

/**
 * 🏛️ ARTEFACTO: page.tsx (Setup Page)
 * ────────────
 * CAPA: Staging / Client (Ignition Wizard)
 * VERSIÓN: 2.0 (Plan Definitivo)
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Descubre silos locales escaneando el directorio storage/.
 * - Permite al usuario cargar un silo existente (SWITCH) o crear e inicializar uno nuevo (INIT).
 * - Renderiza una interfaz premium animada con transiciones suaves.
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Sparkles, FolderKanban, Plus, ChevronLeft, AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SetupPage() {
  const [tenants, setTenants] = useState<string[]>([]);
  const [mode, setMode] = useState<'select' | 'create' | 'github'>('select');
  const [selected, setSelected] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const [githubReady, setGithubReady] = useState<boolean | null>(null);
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');

  // 1. Descubrir silos locales al montar
  useEffect(() => {
    async function loadTenants() {
      try {
        const res = await fetch('/api/bootstrap');
        const json = await res.json();
        if (json.success) {
          setTenants(json.tenants ?? []);
          setGithubReady(json.github_ready ?? false);
          if (json.tenants && json.tenants.length > 0) {
            setSelected(json.tenants[0]);
            setMode('select');
          } else {
            setMode('create');
          }
        }
      } catch (err) {
        console.error('[Setup] Error al cargar silos locales:', err);
      }
    }
    loadTenants();
  }, []);

  // 2. Gestionar el envío del formulario (SWITCH, INIT, o CONNECT_GITHUB)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let body = {};
    if (mode === 'github') {
      if (!githubRepo.trim()) {
        toast.error('El nombre del repositorio es requerido.');
        return;
      }
      body = {
        action: 'CONNECT_GITHUB',
        github_repo: githubRepo,
        github_branch: githubBranch || 'main',
      };
    } else {
      const action = mode === 'create' ? 'INIT' : 'SWITCH';
      const project_identity = mode === 'create' ? newName : selected;
      if (!project_identity.trim()) {
        toast.error('El nombre del proyecto es requerido.');
        return;
      }
      body = { action, project_identity };
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(
        mode === 'github'
          ? 'Conectado a GitHub de forma soberana!'
          : mode === 'create'
            ? 'Sistema inicializado y activado con éxito'
            : 'Silo cargado y activado con éxito'
      );
      
      window.location.href = '/schema';
    } catch (err: any) {
      toast.error(err.message ?? 'Error al procesar la inicialización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm flex flex-col gap-8 p-8 border rounded-3xl shadow-lg bg-card relative overflow-hidden transition-all duration-300">
        
        {/* Decoración de alta fidelidad */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />
        
        <div className="flex flex-col gap-2 items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-sm mb-2">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-wider text-foreground">Agnostic System</h1>
          <p className="text-xs text-muted-foreground">Configura e inicializa tu pasaporte de soberanía antes de comenzar.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* MODO DESPLEGABLE (Seleccionar silo existente) */}
          {mode === 'select' && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seleccionar Silo / Proyecto</Label>
              <Select 
                value={selected} 
                onValueChange={(val) => {
                  if (val === '__CREATE_NEW__') {
                    setMode('create');
                  } else {
                    setSelected(val);
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger className="font-bold text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Selecciona un Silo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {tenants.map(t => (
                    <SelectItem key={t} value={t} className="font-bold text-xs cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FolderKanban size={14} className="text-primary/70" />
                        <span>{t}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="__CREATE_NEW__" className="font-black text-xs text-primary cursor-pointer border-t mt-1 pt-2">
                    <div className="flex items-center gap-2">
                      <Plus size={14} className="text-primary animate-bounce" />
                      <span>+ Crear nuevo silo...</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* MODO CREACIÓN (Nuevo silo) */}
          {mode === 'create' && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex flex-col gap-2">
                <Label htmlFor="newName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del nuevo Silo</Label>
                <Input
                  id="newName"
                  placeholder="Ej. empresa_muebles"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="font-bold text-xs h-10 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* MODO GITHUB (Persistencia Remota Soberana) */}
          {mode === 'github' && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
              {githubReady === false ? (
                <div className="flex flex-col gap-2 p-4 border border-destructive/20 bg-destructive/5 text-destructive rounded-2xl text-left">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                    <AlertTriangle size={14} className="animate-bounce shrink-0" />
                    <span>GITHUB_TOKEN no configurado</span>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-90">
                    Para conectar un repositorio de GitHub, configura <code className="font-mono bg-destructive/10 px-1 py-0.5 rounded">GITHUB_TOKEN</code> como variable de entorno en Vercel o en tu archivo <code className="font-mono bg-destructive/10 px-1 py-0.5 rounded">.env.local</code>.
                  </p>
                  <p className="text-[10px] leading-relaxed opacity-90 font-bold">
                    El token necesita scope 'repo' (Contents: Read and Write). No lo pegues en la UI — configúralo de forma segura en tu entorno.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="githubRepo" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Repositorio (owner/repo)</Label>
                    <Input
                      id="githubRepo"
                      placeholder="Ej. mi-usuario/silo-data"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      disabled={loading}
                      autoFocus
                      className="font-bold text-xs h-10 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="githubBranch" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rama (Branch)</Label>
                    <Input
                      id="githubBranch"
                      placeholder="main"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      disabled={loading}
                      className="font-bold text-xs h-10 rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ESTRATEGIA DE PERSISTENCIA */}
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estrategia de almacenamiento</Label>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant={mode !== 'github' ? 'secondary' : 'outline'}
                onClick={() => {
                  if (mode === 'github') {
                    if (tenants.length > 0) {
                      setMode('select');
                    } else {
                      setMode('create');
                    }
                  }
                }}
                disabled={loading}
                className={`flex-1 text-xs font-bold gap-2 h-9 rounded-xl ${
                  mode !== 'github' 
                    ? 'border border-primary/20 bg-primary/5 text-primary' 
                    : 'text-muted-foreground hover:text-foreground border-input'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${mode !== 'github' ? 'bg-primary' : 'bg-muted-foreground/30'}`} /> Local (JSON)
              </Button>
              <Button 
                type="button"
                variant={mode === 'github' ? 'secondary' : 'outline'}
                onClick={() => setMode('github')}
                disabled={loading}
                className={`flex-1 text-xs font-bold gap-2 h-9 rounded-xl ${
                  mode === 'github' 
                    ? 'border border-primary/20 bg-primary/5 text-primary' 
                    : 'text-muted-foreground hover:text-foreground border-input'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${mode === 'github' ? 'bg-primary' : 'bg-muted-foreground/30'}`} /> Cloud
              </Button>
            </div>
          </div>

          {/* ACCIONES Y BOTÓN PRINCIPAL */}
          <div className="flex flex-col gap-2 mt-2">
            <Button 
              type="submit" 
              disabled={
                loading || 
                (mode === 'create' && !newName.trim()) || 
                (mode === 'select' && !selected) ||
                (mode === 'github' && (!githubRepo.trim() || githubReady === false))
              } 
              className="w-full h-10 font-bold uppercase text-[10px] tracking-widest gap-2 rounded-xl"
            >
              <Shield size={14} />
              {loading 
                ? 'Procesando...' 
                : mode === 'github' 
                  ? 'Conectar Repositorio' 
                  : mode === 'create' 
                    ? 'Crear y Activar Silo' 
                    : 'Cargar Silo Activo'}
            </Button>

            {mode !== 'select' && tenants.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('select')}
                disabled={loading}
                className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 mt-2 cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft size={12} />
                <span>Volver a Silos Existentes</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
