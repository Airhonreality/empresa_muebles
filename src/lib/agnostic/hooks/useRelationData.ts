import React from 'react';
import { useMateriaStore } from '@/lib/agnostic/store';

export function useRelationData(entity: string | null | undefined): {
  data: any[];
  isLoading: boolean;
  mutate: () => Promise<void>;
} {
  const [data, setData] = React.useState<any[]>(() =>
    entity ? (useMateriaStore.getState().data[entity] || []) : []
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const mutate = React.useCallback(async () => {
    if (!entity) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vault?namespace=${entity}`);
      const result = await response.json();
      const records = result.records || [];
      if (records.length > 0) useMateriaStore.getState().setMateria(entity, records);
      setData(records);
    } finally {
      setIsLoading(false);
    }
  }, [entity]);

  React.useEffect(() => {
    if (!entity) return;
    const existing = useMateriaStore.getState().data[entity];
    if (existing && existing.length > 0) {
      setData(existing);
      return;
    }
    mutate().catch(() => setData([]));
  }, [entity, mutate]);

  return { data, isLoading, mutate };
}
