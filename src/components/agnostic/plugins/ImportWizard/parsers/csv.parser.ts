import { ParsedSource } from '../types';

export async function csvParser(file: File): Promise<ParsedSource> {
  const raw = await file.text();
  
  // 🧹 Strip UTF-8 Byte Order Mark (BOM) if present
  const clean = raw.replace(/^\uFEFF/, '').replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  if (lines.length === 0) {
    throw new Error('El archivo CSV está vacío.');
  }

  // 🔍 Auto-detect delimiter: check counts of ; vs , in the first line
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  let delimiter: ';' | ',' | '\t' = ',';
  if (tabCount > semiCount && tabCount > commaCount) {
    delimiter = '\t';
  } else if (semiCount >= commaCount) {
    delimiter = ';';
  }

  // Helper to split line by delimiter, accounting for simple optional wrapping quotes
  const parseLine = (line: string): string[] => {
    // Basic CSV splitting, robust enough for our zero-hardcode sitemaps
    const parts = line.split(delimiter);
    return parts.map(v => {
      const trimmed = v.trim();
      // Remove enclosing quotes if present
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1).trim();
      }
      return trimmed;
    });
  };

  const headers = parseLine(lines[0]).filter(Boolean);
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const rowObj: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowObj[header] = values[i] !== undefined ? values[i] : '';
    });
    return rowObj;
  });

  return {
    filename: file.name,
    headers,
    rows,
    rowCount: rows.length,
    delimiter
  };
}
