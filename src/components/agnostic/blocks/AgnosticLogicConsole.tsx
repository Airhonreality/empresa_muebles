/**
 * 🖥️ ARTEFACTO: AgnosticLogicConsole.tsx
 * ──────────────
 * CAPA: Projection (Logic & DevTools)
 * VERSIÓN: 1.0
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Proporciona un entorno de edición de código soberano dentro de la UI.
 * - Permite modificar los Functores (Zaps) almacenados en el Silo de Negocio.
 * - Inyecta placeholders dinámicos basados en los Esquemas ADN del sistema.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useDNAStore } from '@/lib/agnostic/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Save, Play, Info } from 'lucide-react';
import { toast } from 'sonner';

export function AgnosticLogicConsole({ initialCode = '', fileName = 'logic_zap.js' }) {
  const [code, setCode] = useState(initialCode);
  const { schemas } = useDNAStore();
  
  // 🔍 Placeholder Discovery: Extraemos campos de todos los esquemas para el "Intellisense"
  const availableFields = schemas.flatMap(s => 
    (s.data.fields || []).map((f: any) => `${s.data.name}.${f.key}`)
  );

  const handleSave = async () => {
    try {
      // Aquí conectaremos con el /api/vault para persistir el .js en el Silo
      toast.success(`Archivo ${fileName} guardado en el Silo de Negocio`);
    } catch (error) {
      toast.error('Error al guardar la lógica');
    }
  };

  return (
    <Card className="w-full bg-background border rounded-xl overflow-hidden min-h-[500px] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <Code2 size={18} className="text-primary" />
          <div>
            <CardTitle className="text-sm font-bold">{fileName}</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Consola de Lógica</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 gap-2 font-bold text-[10px]">
            <Play size={14} /> PROBAR
          </Button>
          <Button onClick={handleSave} size="sm" className="h-8 gap-2 font-bold text-[10px]">
            <Save size={14} /> GUARDAR
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col md:flex-row h-[600px]">
        {/* 💻 EDITOR AREA */}
        <div className="flex-1 relative font-mono text-sm leading-relaxed bg-muted/20">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-transparent p-6 text-foreground outline-none resize-none spellcheck-false"
            placeholder="// Escribe tu lógica agnóstica aquí..."
          />
        </div>

        {/* 📚 SIDEBAR: PLACEHOLDERS & DOCUMENTATION */}
        <div className="w-full md:w-64 border-l bg-muted/10 p-4 space-y-6 overflow-y-auto">
          <div>
            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-3 flex items-center gap-2">
              <Info size={12} /> Campos Disponibles
            </h4>
            <div className="space-y-1">
              {availableFields.map(field => (
                <div key={field} className="group flex items-center justify-between p-1.5 rounded-md hover:bg-primary/10 transition-all cursor-pointer">
                  <code className="text-[10px] text-muted-foreground group-hover:text-primary">{field}</code>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-primary/5 rounded-lg border">
             <h4 className="text-[10px] font-bold uppercase text-primary tracking-wider mb-2">Ayuda Axiomática</h4>
             <p className="text-[11px] text-muted-foreground leading-relaxed">
               Usa `export const` para registrar funciones. El motor las descubrirá automáticamente.
             </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
