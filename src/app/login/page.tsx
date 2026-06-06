'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Sparkles, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [noUsers, setNoUsers]   = useState(false);

  useEffect(() => {
    // If already logged in, go straight to the panel
    fetch('/api/auth/me').then(r => {
      if (r.ok) router.replace('/schema');
    });

    // Check if bootstrap is needed (no users yet)
    fetch('/api/bootstrap').then(r => r.json()).then(d => {
      if (d.success && !d.has_users) setNoUsers(true);
    }).catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Bienvenido, ${json.user.name || json.user.email}`);
      router.push('/schema');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm flex flex-col gap-8 p-8 border rounded-3xl shadow-lg bg-card relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />

        <div className="flex flex-col gap-2 items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-sm mb-2">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-wider text-foreground">Agnostic System</h1>
          <p className="text-xs text-muted-foreground">Ingresa tus credenciales para acceder al panel.</p>
        </div>

        {noUsers ? (
          <div className="flex flex-col gap-3 p-4 border border-amber-500/20 bg-amber-500/5 text-amber-600 rounded-2xl text-left">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Sin usuarios configurados</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              El sistema no tiene usuarios todavía. Completa el asistente de configuración para crear el primer administrador.
            </p>
            <Button
              size="sm"
              onClick={() => router.push('/setup')}
              className="w-full h-9 text-xs font-bold uppercase tracking-widest rounded-xl mt-1"
            >
              Ir a Configuración
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
                className="font-bold text-xs h-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className="font-bold text-xs h-10 rounded-xl"
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

        <p className="text-center text-[10px] text-muted-foreground/50">
          ¿Primera vez?{' '}
          <button
            type="button"
            onClick={() => router.push('/setup')}
            className="underline hover:text-foreground transition-colors"
          >
            Ir a Configuración
          </button>
        </p>
      </div>
    </div>
  );
}
