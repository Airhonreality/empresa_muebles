type CommercialRecord = {
  id?: string;
  data?: Record<string, unknown>;
};

export function readCommercialConfigMap(records: CommercialRecord[] | undefined): Record<string, string> {
  return (records ?? []).reduce<Record<string, string>>((acc, record) => {
    const key = record.data?.llave;
    const value = record.data?.valor;
    if (typeof key === 'string' && typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function getCommercialValue(
  records: CommercialRecord[] | undefined,
  key: string,
  fallback: string
): string {
  const value = readCommercialConfigMap(records)[key];
  return value || fallback;
}

export function normalizeWhatsappDestination(value: string): string {
  const compact = value.replace(/[^\d+]/g, '');
  if (compact.startsWith('+')) return compact.slice(1);
  if (compact.startsWith('57')) return compact;
  return `57${compact}`;
}
