'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Sparkles, UserPlus, ChevronLeft } from 'lucide-react';

type Mode = 'login' | 'bootstrap';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode]         = useState<Mode>('login');
  const [loading, setLoading]   = useState(true); // true while checking status

  // Login fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Bootstrap fields (first admin creation)
  const [bEmail, setBEmail]     = useState('');
  const [bPass, setBPass]       = useState('');
  const [bConfirm, setBConfirm] = useState('');

  // ── On mount: check session + user existence ───────────────────────────────
  useEffect(() => {
    async function init() {
      // If already authenticated go straight to panel
      const meRes = await fetch('/api/auth/me').catch(() => null);
      if (meRes?.ok) { router.replace('/schema'); return; }

      // Check if any users exist to decide mode
      const statusRes = await fetch('/api/auth/status').catch(() => null);
      const status    = statusRes ? await statusRes.json().catch(() => null) : null;
      if (status && !status.has_users) setMode('bootstrap');

      setLoading(false);
    }
    init();
  }, [router]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Bienvenido, ${json.user.name || json.user.email}`);
      router.push('/schema');
    } catch (err: any) {
      toast.error(err.message ?? 'Credenciales incorrectas');
      setLoading(false);
    }
  };

  // ── Bootstrap: create first admin ─────────────────────────────────────────
  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bEmail.trim())    { toast.error('El email es requerido.'); return; }
    if (bPass.length < 8)  { toast.error('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (bPass !== bConfirm){ toast.error('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      // Create 'admin' list
      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'user_lists',
          record: { id: crypto.randomUUID(), data: { name: 'admin', is_permanent: true } },
        }),
      });

      // Create admin user
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'users',
          record: { id: crypto.randomUUID(), data: { email: bEmail.trim(), password: bPass, type: ['admin'] } },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Error al crear usuario');

      // Auto-login after creating admin
      const loginRes  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bEmail.trim(), password: bPass }),
      });
      const loginJson = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginJson.error);

      toast.success('Administrador creado. Bienvenido.');
      router.push('/schema');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al crear el administrador');
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm flex flex-col gap-8 p-8 border rounded-3xl shadow-lg bg-card relative overflow-hidden transition-all duration-300">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />

        {/* Header */}
        <div className="flex flex-col gap-2 items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-sm mb-2">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-wider text-foreground">Agnostic System</h1>
          <p className="text-xs text-muted-foreground">
            {mode === 'bootstrap'
              ? 'Primera vez — crea el administrador del sistema.'
              : 'Ingresa tus credenciales para acceder al panel.'}
          </p>
        </div>

        {/* ── Login form ────────────────────────────────────────────────────── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input
                id="email" type="email" placeholder="admin@ejemplo.com"
                value={email} onChange={e => setEmail(e.target.value)}
                disabled={loading} autoFocus className="font-bold text-xs h-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                disabled={loading} className="font-bold text-xs h-10 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full h-10 font-bold uppercase text-[10px] tracking-widest gap-2 rounded-xl mt-2"
            >
              <LogIn size={14} />
              {loading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </form>
        )}

        {/* ── Bootstrap form (first admin) ──────────────────────────────────── */}
        {mode === 'bootstrap' && (
          <form onSubmit={handleBootstrap} className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
              <UserPlus size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No hay usuarios registrados. Crea el primer administrador para habilitar el panel.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bEmail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input
                id="bEmail" type="email" placeholder="admin@ejemplo.com"
                value={bEmail} onChange={e => setBEmail(e.target.value)}
                disabled={loading} autoFocus className="font-bold text-xs h-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bPass" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña (mín. 8 caracteres)</Label>
              <Input
                id="bPass" type="password" placeholder="••••••••"
                value={bPass} onChange={e => setBPass(e.target.value)}
                disabled={loading} className="font-bold text-xs h-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bConfirm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirmar contraseña</Label>
              <Input
                id="bConfirm" type="password" placeholder="••••••••"
                value={bConfirm} onChange={e => setBConfirm(e.target.value)}
                disabled={loading}
                className={`font-bold text-xs h-10 rounded-xl ${bConfirm && bPass !== bConfirm ? 'border-destructive/50' : ''}`}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !bEmail.trim() || bPass.length < 8 || bPass !== bConfirm}
              className="w-full h-10 font-bold uppercase text-[10px] tracking-widest gap-2 rounded-xl mt-1"
            >
              <UserPlus size={14} />
              {loading ? 'Creando...' : 'Crear Administrador e Ingresar'}
            </Button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
              <ChevronLeft size={11} /> Ya tengo usuario
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
