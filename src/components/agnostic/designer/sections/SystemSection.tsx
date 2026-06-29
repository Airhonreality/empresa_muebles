'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Database, Palette, RefreshCw, Sparkles } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import { toast } from 'sonner';

// Helper utilities for HSL/HEX conversion
function hslToHex(hslStr: string): string {
  if (!hslStr) return '#0f172a';
  const clean = hslStr.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length < 3) return '#0f172a';
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace('%', '')) / 100;
  const l = parseFloat(parts[2].replace('%', '')) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return '222.2 47.4% 11.2%';

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

const GOOGLE_FONTS = [
  { label: 'Inter (Sans-serif)', value: 'Inter, sans-serif' },
  { label: 'Roboto (Sans-serif)', value: 'Roboto, sans-serif' },
  { label: 'Outfit (Sleek modern)', value: 'Outfit, sans-serif' },
  { label: 'Playfair Display (Elegant Serif)', value: 'Playfair Display, serif' },
  { label: 'System UI Default', value: 'system-ui, -apple-system, sans-serif' }
];

const RADIUS_OPTIONS = [
  { label: 'Recto (0px)', value: '0rem' },
  { label: 'Suave (0.25rem)', value: '0.25rem' },
  { label: 'Estándar (0.5rem)', value: '0.5rem' },
  { label: 'Redondeado (0.75rem)', value: '0.75rem' },
  { label: 'Extra redondo (1.0rem)', value: '1.0rem' }
];

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

export function SystemSection() {
  const { data } = useAppState();
  const { saveItem } = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);

  // Read design tokens from Materia store
  const tokens = data?.design_tokens || [];
  const primaryToken = tokens.find((t: any) => t.data?.name === 'primary');
  const radiusToken = tokens.find((t: any) => t.data?.name === 'radius');
  const fontToken = tokens.find((t: any) => t.data?.name === 'font_sans');

  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [radius, setRadius] = useState('0.5rem');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');

  // Hydrate local state when store tokens load/change
  useEffect(() => {
    if (primaryToken?.data?.value) {
      setPrimaryColor(hslToHex(asString(primaryToken.data.value, '')));
    }
    if (radiusToken?.data?.value) {
      setRadius(asString(radiusToken.data.value, '0.5rem'));
    }
    if (fontToken?.data?.value) {
      setFontFamily(asString(fontToken.data.value, 'Inter, sans-serif'));
    }
  }, [primaryToken, radiusToken, fontToken]);

  const isDirty =
    hslToHex(asString(primaryToken?.data?.value, '')) !== primaryColor ||
    asString(radiusToken?.data?.value, '0.5rem') !== radius ||
    asString(fontToken?.data?.value, 'Inter, sans-serif') !== fontFamily;

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      // 1. Convert HEX to Tailwind HSL format
      const primaryHsl = hexToHsl(primaryColor);

      // 2. Save/Update design tokens in DB
      await saveItem('design_tokens', {
        id: primaryToken?.id || undefined, // undefined triggers randomUUID in saveItem
        data: { name: 'primary', value: primaryHsl, category: 'color' }
      }, { silent: true });

      await saveItem('design_tokens', {
        id: radiusToken?.id || undefined,
        data: { name: 'radius', value: radius, category: 'radius' }
      }, { silent: true });

      await saveItem('design_tokens', {
        id: fontToken?.id || undefined,
        data: { name: 'font_sans', value: fontFamily, category: 'typography' }
      }, { silent: true });

      // 3. Compile design tokens to tokens.css file physical compile
      const syncRes = await fetch('/api/tokens/sync', { method: 'POST' });
      const syncData = await syncRes.json();

      if (syncData.ok) {
        toast.success('Diseño visual guardado y compilado con éxito');
      } else {
        toast.warning('Tokens guardados en DB pero falló la compilación de estilos locales.');
      }
    } catch (err: any) {
      toast.error(`Error guardando aspecto visual: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-2 animate-in fade-in duration-500">
      
      {/* ── SECCIÓN 1: Identidad y Persistencia ───────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Shield size={14} className="text-primary" /> Soberanía y Núcleo
        </h3>
        <div className="bg-background border rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estrategia de Persistencia Activa</Label>
            <div className="h-10 px-4 border bg-muted/20 rounded-xl flex items-center text-xs font-bold text-foreground justify-between">
              <span className="flex items-center gap-2 text-primary">
                <Database size={13} />
                {process.env.GITHUB_REPO ? 'GitHub Repository Strategy' : process.env.DATABASE_URL ? 'PostgreSQL Database Strategy' : process.env.SUPABASE_URL ? 'Supabase cloud Strategy' : 'Desarrollo Local (JSON files)'}
              </span>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Activa
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground/60 mt-1 pl-1">
              La persistencia de datos se resuelve dinámicamente en base a las variables de entorno configuradas.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: Personalización del Tema ─────────────────────────────── */}
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <Palette size={14} className="text-primary" /> Personalización del Tema
          </h3>
          {isDirty && (
            <Button
              size="sm"
              onClick={handleSaveTheme}
              disabled={isSaving}
              className="h-8 text-[9px] font-black uppercase tracking-widest rounded-xl gap-2 px-4 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <RefreshCw size={10} className={isSaving ? 'animate-spin' : ''} />
              {isSaving ? 'Guardando...' : 'Aplicar Cambios'}
            </Button>
          )}
        </div>

        <div className="bg-background border rounded-[2rem] p-6 shadow-sm space-y-6">
          
          {/* Color Primario Picker */}
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Color Primario Corporativo</Label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#0f172a"
                  className="w-full h-10 pl-3 pr-10 border rounded-xl text-xs font-mono bg-background text-foreground uppercase"
                />
                <div
                  className="absolute right-3 top-2.5 w-5 h-5 rounded-full border shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 p-0 rounded-xl cursor-pointer border shrink-0 bg-transparent"
                title="Seleccionar Color"
              />
            </div>
            <p className="text-[9px] text-muted-foreground/60 pl-1">
              Controla los botones principales, estados activos y bordes de enfoque en la interfaz.
            </p>
          </div>

          {/* Radio de Borde */}
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estilo de Bordes (Radius)</Label>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Selecciona el redondeado..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {RADIUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[9px] text-muted-foreground/60 pl-1">
              Curvatura aplicada a tarjetas, inputs, botones y paneles contenedores.
            </p>
          </div>

          {/* Tipografía Sans-Serif */}
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Familia Tipográfica</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Selecciona la tipografía..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {GOOGLE_FONTS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[9px] text-muted-foreground/60 pl-1">
              Familia de fuentes cargada a nivel de interfaz global para la legibilidad de textos.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
