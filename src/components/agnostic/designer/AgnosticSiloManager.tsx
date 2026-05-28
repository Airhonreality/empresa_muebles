/**
 * 🏛️ ARTEFACTO: AgnosticSiloManager.tsx
 * ────────────
 * CAPA: Designer / Proyectores (Infrastructure Management)
 * VERSIÓN: 1.0 (Phase 3 - DDL Master)
 * COMMIT: P3-M1.10-SILO-MANAGER-UI
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Visualización de la realidad física de los Silos (Local vs Supabase).
 * - Orquestación del flujo de 3 clics: WIPE -> IMPORT -> EVOLVE.
 * - Auditoría de capacidades del puente activo.
 */

import React, { useState, useEffect } from 'react';
import { Database, Zap, Trash2, RefreshCw, Layers, ShieldCheck, Cloud, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSystemStore, useMateriaStore, useDNAStore } from '@/lib/agnostic/store';
import { toast } from 'sonner';

export const AgnosticSiloManager: React.FC = () => {
  const { data: materia } = useMateriaStore();
  const { schemas, routes } = useDNAStore();
  const [capabilities, setCapabilities] = useState<any>(null);
  const [infrastructure, setInfrastructure] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔭 INTROSPECT: Cargar capacidades y realidad física al montar
  useEffect(() => {
    const fetchReality = async () => {
      try {
        setIsLoading(true);
        // 1. Obtener capacidades del puente
        const capRes = await fetch('/api/vault?context=system_capabilities');
        const capData = await capRes.json();
        setCapabilities(capData.system_capabilities?.[0]?.data || {});

        // 2. Inspeccionar infraestructura física
        const insRes = await fetch('/api/vault');
        const insData = await insRes.json();
        setInfrastructure(insData.infrastructure || []);
      } catch (e) {
        toast.error('Error al inspeccionar la realidad del silo');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReality();
  }, []);

  // 🧼 ACCIÓN: WIPE (Borrado Total)
  const handleWipe = async () => {
    if (!confirm('¿ESTÁS SEGURO? Esta acción purgará TODA la materia física del silo actual.')) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/vault', {
        method: 'POST',
        body: JSON.stringify({ action: 'WIPE', scope: 'DATA' })
      });
      if (res.ok) {
        toast.success('Silo purgado con éxito. Realidad despejada.');
        setInfrastructure([]);
      }
    } catch (e) {
      toast.error('Error en la purga del silo');
    } finally {
      setIsLoading(false);
    }
  };

  // 🧬 ACCIÓN: EVOLVE (Cristalización de ADN)
  const handleEvolve = async () => {
    try {
      setIsLoading(true);
      toast.loading('Evolucionando infraestructura física...');
      
      // Evolucionamos cada esquema definido en el ADN
      for (const schema of schemas) {
        const dna = {
          name: schema.data.name,
          fields: schema.data.fields
        };
        await fetch('/api/vault', {
          method: 'POST',
          body: JSON.stringify({ action: 'EVOLVE', namespace: dna.name, dna })
        });
      }

      // Re-inspeccionar
      const insRes = await fetch('/api/vault');
      const insData = await insRes.json();
      setInfrastructure(insData.infrastructure || []);
      
      toast.dismiss();
      toast.success('Infraestructura evolucionada correctamente.');
    } catch (e) {
      toast.error('Error durante la evolución');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* 🏛️ HEADER: Estado del Silo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Silo Management <span className="text-muted-foreground/30 font-thin">v4.0</span>
          </h2>
          <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">
            Gestión de Materia y Estructura Física
          </p>
        </div>

        <div className="flex gap-4">
          <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase ${capabilities?.storageType === 'SQL' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
            {capabilities?.storageType === 'SQL' ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
            {capabilities?.storageType || 'LOCAL'} MODE
          </div>
          <div className="px-4 py-2 rounded-full border border-green-500/20 bg-green-500/10 text-green-500 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            Sovereign Engine Active
          </div>
        </div>
      </div>

      {/* 🚀 ACCIONES MAESTRAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold uppercase text-xs tracking-widest">1. Purificar Realidad</h3>
            <p className="text-muted-foreground text-[10px] leading-relaxed mt-1 italic">
              Elimina toda la materia física del silo actual. Deja el espacio virgen para una nueva hidratación.
            </p>
          </div>
          <Button 
            variant="destructive" 
            className="w-full uppercase text-[10px] font-black tracking-[0.2em] h-12 rounded-xl"
            onClick={handleWipe}
            disabled={isLoading || !capabilities?.canWipe}
          >
            Wipe Silo
          </Button>
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold uppercase text-xs tracking-widest">2. Sincronizar ADN</h3>
            <p className="text-muted-foreground text-[10px] leading-relaxed mt-1 italic">
              Asegura que los esquemas y rutas locales estén presentes en la memoria del sistema.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="w-full uppercase text-[10px] font-black tracking-[0.2em] h-12 rounded-xl"
            disabled={true} // Se asume automático por ahora
          >
            DNA Synchronized
          </Button>
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold uppercase text-xs tracking-widest">3. Evolucionar Materia</h3>
            <p className="text-muted-foreground text-[10px] leading-relaxed mt-1 italic">
              Cristaliza la estructura física (Tablas/Archivos) basándose en las definiciones del ADN actual.
            </p>
          </div>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 uppercase text-[10px] font-black tracking-[0.2em] h-12 rounded-xl shadow-xl shadow-blue-500/20"
            onClick={handleEvolve}
            disabled={isLoading || !capabilities?.canEvolve}
          >
            Evolve Infrastructure
          </Button>
        </div>
      </div>

      {/* 🔍 INSPECTOR DE INFRAESTRUCTURA */}
      <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-8 border border-dashed">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <Layers className="w-3 h-3" />
          Realidad Física Detectada
        </h4>

        {infrastructure.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-xs uppercase tracking-widest italic font-thin">
              No se han detectado estructuras físicas en el silo. El espacio está virgen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {infrastructure.map((dna, i) => (
              <div key={i} className="bg-card border rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all cursor-default">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/40">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-center truncate w-full">
                  {dna.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
