import { notFound } from 'next/navigation';
import { resolvePublicLink, type PublicField } from '@/server/public-links';

function formatValue(value: unknown, field: PublicField): string {
  if (value === null || value === undefined || value === '') return '—';
  if (field.format === 'currency' && typeof value === 'number') return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
  if (field.format === 'number' && typeof value === 'number') return new Intl.NumberFormat('es-CO').format(value);
  if (field.format === 'date') return new Intl.DateTimeFormat('es-CO').format(new Date(String(value)));
  if (field.format === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

export default async function PublicSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const document = await resolvePublicLink(token);
  if (!document) notFound();

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <article className="mx-auto max-w-3xl rounded-xl border bg-card p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento compartido</p>
        <h1 className="mb-8 text-3xl font-bold">{document.title}</h1>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {document.fields.map(field => (
            <div key={field.key} className="border-b pb-4">
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 font-medium">{formatValue(field.value, field)}</dd>
            </div>
          ))}
        </dl>
      </article>
    </main>
  );
}
