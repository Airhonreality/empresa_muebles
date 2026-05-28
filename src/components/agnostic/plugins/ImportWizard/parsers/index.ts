import { ParsedSource } from '../types';

type ParserFn = (file: File) => Promise<ParsedSource>;

const registry = new Map<string, ParserFn>();

export function registerParser(mimeType: string, parser: ParserFn): void {
  registry.set(mimeType, parser);
}

export function getParser(file: File): ParserFn | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return registry.get(file.type)
    ?? registry.get(`ext/${ext}`)
    ?? null;
}
