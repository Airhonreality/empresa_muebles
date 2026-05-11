/**
 * 🏛️ ARTEFACTO: AgnosticSheet.tsx
 * ────────────
 * CAPA: Projection (Decentralized Blocks)
 * VERSIÓN: 8.0
 * ADR: [adr_v8_0_deterministic_state.md]
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Ingreso de datos industrial de alta densidad (Matrices).
 * - Sincronización 'Sovereign State' (La UI es la fuente de verdad en sesión).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Usar Gated Hydration para prevenir regresiones de estado por latencia.
 * - MUST: Generar IDs deterministas en el cliente para evitar registros fantasma.
 * - NEVER: Importar lógica de cálculo específica (delegar a Logic Engine).
 */
'use client';

import React from 'react';
import { useDNAStore, useMateriaStore, useSystemStore } from '@/lib/agnostic/store';
import { useAppDispatch } from '@/context/AppContext';
import { getModuleIcon } from '@/lib/agnostic/constants';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, Calculator } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';

interface Props {
  schemaId: string;
  context: string; 
  parentId?: string; 
  parentKey?: string; 
  className?: string;
  syncMode?: 'manual' | 'auto';
}

export function AgnosticSheet({ 
  schemaId, 
  context,
  parentId, 
  parentKey = 'spaceId',
  className,
  syncMode = 'auto'
}: Props) {
  const { data: materiaStore } = useMateriaStore();
  const { schemas } = useDNAStore();
  const { isLoading: isSystemLoading } = useSystemStore();
  
  const { saveItem, deleteItem } = useAppDispatch();
  const [items, setItems] = React.useState<any[]>([]);
  const hasHydrated = React.useRef(false);
  const lastParentId = React.useRef(parentId);

  // 🔄 SOVEREIGN HYDRATION (v8.0)
  React.useEffect(() => {
    if (lastParentId.current !== parentId) {
      hasHydrated.current = false;
      lastParentId.current = parentId;
    }

    const allItems = materiaStore[context] || [];

    if (!hasHydrated.current && context && allItems.length >= 0) {
      if (!parentId && parentKey) {
        setItems([]);
        hasHydrated.current = true;
        return;
      }
      
      const filtered = parentId 
        ? allItems.filter((i: any) => i.data[parentKey] === parentId)
        : allItems;
      
      if (filtered.length > 0 || !isSystemLoading) {
        setItems(filtered.map((f: any) => ({ ...f.data, _id: f.id })));
        hasHydrated.current = true;
      }
    }
  }, [materiaStore, context, parentId, parentKey, isSystemLoading]);

  const schemaItem = schemas.find((s) => s.id === schemaId);
  const schema = schemaItem?.data as Record<string, any> | null;

  if (!schema || !context) return null;

  const handleUpdate = async (index: number, key: string, value: any) => {
    const newItems = [...items];
    const itemData = { ...newItems[index], [key]: value };
    
    if (key === 'name' && value) {
      const catalog = materiaStore['items'] || [];
      const catalogItem = catalog.find((i: any) => i.data.name === value);
      
      if (catalogItem) {
        itemData.unit = catalogItem.data.unit || 'UND';
        itemData.price = catalogItem.data.price_cost || catalogItem.data.price || 0;
      }
    }

    if (key === 'quantity' || key === 'price' || (key === 'name' && value)) {
      itemData.total = (itemData.quantity || 0) * (itemData.price || 0);
    }

    newItems[index] = itemData;
    setItems(newItems);

    if (syncMode === 'auto') {
      const payload = {
        id: itemData._id,
        context: context,
        data: { ...itemData }
      };
      delete (payload.data as any)._id;
      await saveItem(context, payload);
    }
  };

  const addItem = async () => {
    const newId = globalThis.crypto.randomUUID(); 
    
    const newItem = {
      _id: newId,
      [parentKey]: parentId,
      name: '',
      unit: 'UND',
      quantity: 1,
      price: 0,
      total: 0
    };
    
    const updatedList = [...items, newItem];
    setItems(updatedList);

    if (syncMode === 'auto') {
      const payload = {
        id: newId,
        context: context,
        data: { ...newItem }
      };
      delete (payload.data as any)._id;
      await saveItem(context, payload);
    }
  };

  const removeItem = async (id: string) => {
    await deleteItem(context, id);
    toast.info("Línea eliminada");
  };

  const catalog = materiaStore['items'] || [];

  return (
    <div className={cn("rounded-lg border border-border/20 overflow-hidden bg-background/20 backdrop-blur-sm", className)}>
      <datalist id="catalog-items">
        {catalog.map((i: any) => (
          <option key={i.id} value={i.data.name}>
            ${i.data.price_cost || i.data.price} - {i.data.unit}
          </option>
        ))}
      </datalist>
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-border/10">
            <TableHead className="w-[30px] p-0"></TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest h-8 py-0">Materia / Descripción</TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest h-8 py-0 w-[80px]">Cant.</TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest h-8 py-0 w-[60px]">Und</TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest h-8 py-0 w-[100px]">P. Unit</TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest h-8 py-0 w-[100px] text-right">Total</TableHead>
            <TableHead className="w-[40px] p-0"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={item._id || `row-${idx}`} className="group/row hover:bg-primary/[0.02] border-border/5 transition-colors">
              <TableCell className="p-0 text-center opacity-0 group-hover/row:opacity-20 transition-opacity cursor-grab">
                <GripVertical className="w-3 h-3 mx-auto" />
              </TableCell>
              <TableCell className="p-0">
                <Input 
                  value={item.name}
                  list="catalog-items"
                  onChange={(e) => handleUpdate(idx, 'name', e.target.value)}
                  className="h-8 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20 font-bold text-[11px] rounded-none px-2"
                  placeholder="Seleccionar material..."
                />
              </TableCell>
              <TableCell className="p-0">
                <Input 
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdate(idx, 'quantity', parseFloat(e.target.value))}
                  className="h-8 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20 font-black text-[11px] rounded-none px-2 text-center"
                />
              </TableCell>
              <TableCell className="p-0 text-center text-[10px] font-bold opacity-40 uppercase">
                {item.unit}
              </TableCell>
              <TableCell className="p-0">
                <Input 
                  type="number"
                  value={item.price}
                  onChange={(e) => handleUpdate(idx, 'price', parseFloat(e.target.value))}
                  className="h-8 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20 font-bold text-[11px] rounded-none px-2 text-right"
                />
              </TableCell>
              <TableCell className="p-2 text-right text-[11px] font-black font-mono">
                ${(item.total || 0).toLocaleString()}
              </TableCell>
              <TableCell className="p-0 text-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeItem(item._id)}
                  className="w-6 h-6 opacity-0 group-hover/row:opacity-40 hover:opacity-100 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={7} className="p-1">
              <Button 
                variant="ghost" 
                onClick={addItem}
                className="w-full h-7 border border-dashed border-border/20 hover:border-primary/40 hover:bg-primary/[0.02] text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all gap-2"
              >
                <Plus className="w-3 h-3" />
                Agregar Fila de Materia
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="p-2 bg-muted/20 border-t border-border/10 flex justify-between items-center">
        <div className="flex items-center gap-1.5 opacity-20">
          <Calculator className="w-3 h-3" />
          <span className="text-[8px] font-black uppercase tracking-widest">Subtotal Materia</span>
        </div>
        <div className="text-[13px] font-black font-mono italic tracking-tighter text-primary">
          ${items.reduce((acc, i) => acc + (i.total || 0), 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
