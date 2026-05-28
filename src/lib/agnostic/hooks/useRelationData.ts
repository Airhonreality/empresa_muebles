import React from 'react';
import { useMateriaStore } from '@/lib/agnostic/store';

export function useRelationData(entity: string | null | undefined): {
  data: any[];
  isLoading: boolean;
} {
  const [data, setData] = React.useState<any[]>(() =>
    entity ? (useMateriaStore.getState().data[entity] || []) : []
  );
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!entity) return;
    const existing = useMateriaStore.getState().data[entity];
    if (existing && existing.length > 0) {
      setData(existing);
      return;
    }
    setIsLoading(true);
    fetch(`/api/vault?namespace=${entity}`)
      .then(r => r.json())
      .then(result => {
        const records = result.records || [];
        // Hidratar el store: el segundo componente que pida la misma entidad
        // no hace fetch — lee del store directamente.
        if (records.length > 0) {
          useMateriaStore.getState().setMateria(entity, records);
        }
        setData(records);
      })
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, [entity]);

  return { data, isLoading };
}
