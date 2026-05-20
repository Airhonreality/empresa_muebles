import { ParsedSource } from '../types';

export async function jsonParser(file: File): Promise<ParsedSource> {
  const raw = await file.text();
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('El archivo no contiene un formato JSON válido.');
  }

  // Ensure we are working with an array of objects
  const parsedArray = Array.isArray(parsed) ? parsed : [parsed];
  const records = parsedArray.filter(
    (rec): rec is Record<string, unknown> => rec !== null && typeof rec === 'object'
  );
  
  if (records.length === 0) {
    throw new Error('El archivo JSON debe contener un arreglo de objetos.');
  }

  // Gather all unique keys across all records (defensive scanning)
  const headerSet = new Set<string>();
  records.forEach(rec => {
    Object.keys(rec).forEach(k => headerSet.add(k));
  });

  const headers = Array.from(headerSet);
  const rows = records.map(rec => {
    const rowObj: Record<string, string> = {};
    headers.forEach(h => {
      const val = rec[h];
      if (val === undefined || val === null) {
        rowObj[h] = '';
      } else if (typeof val === 'object') {
        rowObj[h] = JSON.stringify(val);
      } else {
        rowObj[h] = String(val);
      }
    });
    return rowObj;
  });

  return {
    filename: file.name,
    headers,
    rows,
    rowCount: rows.length
  };
}
