'use client';

import React, { useState, useMemo } from 'react';
import { Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FieldPickerModalProps {
  schemaName: string;
  schema: any;
  currentFilter: string[] | undefined;
  onConfirm: (selectedKeys: string[]) => void;
  onClose: () => void;
}

export function FieldPickerModal({ schemaName, schema, currentFilter, onConfirm, onClose }: FieldPickerModalProps) {
  const allFields: any[] = schema?.data?.fields ?? [];
  const allKeys = allFields.map((f: any) => f.key);

  const [selected, setSelected] = useState<string[]>(currentFilter ?? allKeys);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => allFields.filter((f: any) =>
      f.label?.toLowerCase().includes(search.toLowerCase()) ||
      f.key?.toLowerCase().includes(search.toLowerCase())
    ),
    [allFields, search]
  );

  const toggle = (key: string) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onConfirm(selected);
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xs font-black uppercase tracking-widest">
            Campos de <span className="text-primary">{schemaName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar campo..."
              className="h-8 pl-8 text-xs font-semibold"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest h-6 px-2"
              onClick={() => setSelected(allKeys)}>
              Todos ({allKeys.length})
            </Button>
            <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest h-6 px-2"
              onClick={() => setSelected([])}>
              Ninguno
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 border rounded-xl p-2 bg-muted/5">
            {filtered.length === 0 && (
              <div className="text-center py-6 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Sin resultados
              </div>
            )}
            {filtered.map((f: any) => {
              const isSelected = selected.includes(f.key);
              return (
                <div
                  key={f.key}
                  onClick={() => toggle(f.key)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold">{f.label || f.key}</span>
                    <span className="text-[9px] font-mono opacity-60">{f.key} · {f.type}</span>
                  </div>
                  {isSelected && <Check size={12} className="text-primary shrink-0" />}
                </div>
              );
            })}
          </div>

          <p className="text-[9px] text-muted-foreground text-center">
            {selected.length} de {allKeys.length} campos seleccionados
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={selected.length === 0}
            className="text-[10px] font-black uppercase tracking-widest">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
