import 'server-only';

import { z } from 'zod';
import agnosticConfig from '../../agnostic.config';
import { getStrategy } from '@/server/getStrategy';

const identifier = z.string().regex(/^[a-z][a-z0-9_]*$/);
const publicScalar = z.union([z.string(), z.number(), z.boolean()]);
const fixedFilterSchema = z.object({
  key: identifier,
  operator: z.enum(['eq', 'in']),
  value: z.union([publicScalar, z.array(publicScalar).min(1).max(50)]),
});
const modelSchema = z.object({
  name: identifier,
  source: identifier,
  fields: z.array(z.object({
    key: identifier,
    label: z.string().min(1).max(120).optional(),
    format: z.enum(['text', 'currency', 'number', 'date', 'boolean']).optional(),
  })).min(1).max(50),
  fixed_filters: z.array(fixedFilterSchema).min(1).max(20),
  filters: z.array(z.object({
    key: identifier,
    operator: z.enum(['eq', 'in', 'contains', 'gte', 'lte']),
    max_values: z.number().int().min(1).max(50).optional(),
  })).max(20).optional(),
  sort: z.array(z.object({
    key: identifier,
    directions: z.array(z.enum(['asc', 'desc'])).min(1).max(2).optional(),
  })).max(10).optional(),
  default_sort: z.object({ key: identifier, direction: z.enum(['asc', 'desc']) }).optional(),
  limit: z.object({ default: z.number().int().min(1).max(100), max: z.number().int().min(1).max(100) }).optional(),
}).superRefine((model, ctx) => {
  if (new Set(model.fields.map(field => field.key)).size !== model.fields.length) ctx.addIssue({ code: 'custom', message: 'duplicate public field' });
  if (new Set(model.fixed_filters.map(filter => filter.key)).size !== model.fixed_filters.length) ctx.addIssue({ code: 'custom', message: 'duplicate fixed filter' });
  if (model.filters?.some(filter => model.fixed_filters.some(fixed => fixed.key === filter.key))) ctx.addIssue({ code: 'custom', message: 'dynamic filters cannot override fixed filters' });
  if (model.limit && model.limit.default > model.limit.max) ctx.addIssue({ code: 'custom', message: 'limit.default cannot exceed limit.max' });
  if (model.default_sort && !model.sort?.some(sort => sort.key === model.default_sort!.key)) ctx.addIssue({ code: 'custom', message: 'default_sort must be declared in sort' });
});

export type PublicReadModel = z.infer<typeof modelSchema>;

function getModels(): PublicReadModel[] {
  const parsed = z.array(modelSchema).safeParse(agnosticConfig.publicReadModels ?? []);
  if (!parsed.success) throw new Error(`Invalid publicReadModels configuration: ${parsed.error.message}`);
  return parsed.data;
}

export function getPublicReadModel(name: string): PublicReadModel | null {
  return getModels().find(model => model.name === name) ?? null;
}

function publicValue(value: unknown): string | number | boolean | Array<string | number | boolean> | null {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value) && value.every(item => ['string', 'number', 'boolean'].includes(typeof item))) return value as Array<string | number | boolean>;
  return null;
}

function compare(value: unknown, operator: string, expected: string[]): boolean {
  const scalar = publicValue(value);
  if (scalar === null) return false;
  if (operator === 'in') return expected.includes(String(scalar));
  if (operator === 'contains') return Array.isArray(scalar) ? scalar.some(item => String(item) === expected[0]) : String(scalar).toLowerCase().includes(expected[0].toLowerCase());
  if (operator === 'gte') return typeof scalar === 'number' ? scalar >= Number(expected[0]) : String(scalar) >= expected[0];
  if (operator === 'lte') return typeof scalar === 'number' ? scalar <= Number(expected[0]) : String(scalar) <= expected[0];
  return String(scalar) === expected[0];
}

function valuesFor(filter: { operator: string, value: string | number | boolean | Array<string | number | boolean> }): string[] {
  const rawValues = Array.isArray(filter.value) ? filter.value : [filter.value];
  return rawValues.map(value => String(value));
}

export async function readPublicModel(name: string, query: URLSearchParams) {
  const model = getPublicReadModel(name);
  if (!model) return null;
  const filters = model.filters ?? [];
  const requestedFilters = [...query.keys()].filter(key => key.startsWith('filter.'));
  for (const requestKey of requestedFilters) {
    const key = requestKey.slice('filter.'.length);
    if (!filters.some(filter => filter.key === key)) throw new Error(`Filter '${key}' is not allowed`);
  }

  const requestedSort = query.get('sort') ?? model.default_sort?.key;
  const direction = (query.get('direction') ?? model.default_sort?.direction ?? 'asc') as 'asc' | 'desc';
  if (direction !== 'asc' && direction !== 'desc') throw new Error('direction must be asc or desc');
  if (requestedSort) {
    const sort = model.sort?.find(candidate => candidate.key === requestedSort);
    if (!sort || (sort.directions && !sort.directions.includes(direction))) throw new Error(`Sort '${requestedSort}' is not allowed`);
  }

  const configuredLimit = model.limit ?? { default: 24, max: 100 };
  const rawLimit = query.get('limit');
  const limit = rawLimit === null ? configuredLimit.default : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > configuredLimit.max) throw new Error(`limit must be between 1 and ${configuredLimit.max}`);

  let records = await getStrategy().read(model.source);
  for (const filter of model.fixed_filters) {
    records = records.filter(record => compare(record.data?.[filter.key], filter.operator, valuesFor(filter)));
  }
  for (const filter of filters) {
    const raw = query.get(`filter.${filter.key}`);
    if (raw === null) continue;
    const values = filter.operator === 'in' ? raw.split(',').filter(Boolean) : [raw];
    if (values.length > (filter.max_values ?? 20)) throw new Error(`Filter '${filter.key}' has too many values`);
    records = records.filter(record => compare(record.data?.[filter.key], filter.operator, values));
  }
  if (requestedSort) {
    records.sort((a, b) => {
      const left = String(publicValue(a.data?.[requestedSort]) ?? '');
      const right = String(publicValue(b.data?.[requestedSort]) ?? '');
      const result = left.localeCompare(right, undefined, { numeric: true });
      return direction === 'asc' ? result : -result;
    });
  }

  return {
    resource: model.name,
    records: records.slice(0, limit).map(record =>
      Object.fromEntries(model.fields.map(field => [field.key, publicValue(record.data?.[field.key])]))
    ),
  };
}

export async function getPublicModelRevision(name: string): Promise<{ exists: boolean, revision: string | null }> {
  const model = getPublicReadModel(name);
  if (!model) return { exists: false, revision: null };
  const strategy = getStrategy() as { getNamespaceSha?: (namespace: string) => Promise<string | null> };
  const revision = typeof strategy.getNamespaceSha === 'function' ? await strategy.getNamespaceSha(model.source) : null;
  return { exists: true, revision };
}
