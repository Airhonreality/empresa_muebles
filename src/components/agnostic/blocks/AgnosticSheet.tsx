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
  
  // Resolve initial items from store. No useEffect sync needed because key strategy handles remounts.
  const [items, setItems] = React.useState<any[]>(() => {
    const allItems = materiaStore[context] || [];
    const filtered = parentId 
      ? allItems.filter((i: any) => i.data[parentKey] === parentId)
      : allItems;
    return filtered.map((f: any) => ({ ...f.data, _id: f.id }));
  });

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
    <div className={cn("rounded-xl border bg-background overflow-hidden", className)}>
      <datalist id="catalog-items">
        {catalog.map((i: any) => (
          <option key={i.id} value={i.data.name}>
            ${i.data.price_cost || i.data.price} - {i.data.unit}
          </option>
        ))}
      </datalist>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[30px] p-0"></TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider h-10">Materia / Descripción</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider h-10 w-[100px]">Cant.</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider h-10 w-[60px]">Und</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider h-10 w-[120px]">P. Unit</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider h-10 w-[120px] text-right">Total</TableHead>
            <TableHead className="w-[40px] p-0"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={item._id || `row-${idx}`} className="group/row">
              <TableCell className="p-0 text-center opacity-20 transition-opacity cursor-grab">
                <GripVertical className="w-3 h-3 mx-auto" />
              </TableCell>
              <TableCell className="p-0">
                <Input 
                  value={item.name}
                  list="catalog-items"
                  onChange={(e) => handleUpdate(idx, 'name', e.target.value)}
                  className="h-9 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20 font-bold text-xs rounded-none px-3"
                  placeholder="Seleccionar material..."
                />
              </TableCell>
              <TableCell className="p-0">
                <Input 
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdate(idx, 'quantity', parseFloat(e.target.value))}
                  className="h-9 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20 font-bold text-xs rounded-none px-3 text-center"
                />
              </TableCell>
              <TableCell className="p-0 text-center text-[10px] font-bold text-muted-foreground uppercase">
                {item.unit}
              </TableCell>
              <TableCell className="p-0">
                <Input 
                  type="number"
                  value={item.price}
                  onChange={(e) => handleUpdate(idx, 'price', parseFloat(e.target.value))}
                  className="h-9 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20 font-bold text-xs rounded-none px-3 text-right"
                />
              </TableCell>
              <TableCell className="p-3 text-right text-xs font-bold font-mono">
                ${(item.total || 0).toLocaleString()}
              </TableCell>
              <TableCell className="p-0 text-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeItem(item._id)}
                  className="w-8 h-8 opacity-0 group-hover/row:opacity-100 text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={7} className="p-2">
              <Button 
                variant="ghost" 
                onClick={addItem}
                className="w-full h-9 border border-dashed text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Fila de Materia
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <Calculator className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Subtotal Materia</span>
        </div>
        <div className="text-lg font-bold font-mono text-primary tracking-tight">
          ${items.reduce((acc, i) => acc + (i.total || 0), 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
