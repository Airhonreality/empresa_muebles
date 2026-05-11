/**
 * 🛰️ API: Logic Vault Loader
 * ────────────────────────
 * AXIOMATIC_CONTRACT:
 * - MUST: Leer quirúrgicamente archivos .js del directorio /logic del tenant activo.
 * - MUST: Proveer el contenido raw de los scripts para hidratación del LogicEngine.
 * - NEVER: Ejecutar el código en el servidor (solo transporte).
 * 
 * ADR: Se crea un endpoint específico para lógica para separar los datos 
 * estructurados (JSON) del comportamiento dinámico (JS) del Silo.
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const activeTenant = process.env.ACTIVE_TENANT || 'default';
  const logicDir = path.join(process.cwd(), 'storage', activeTenant, 'logic');

  try {
    // Asegurar que el directorio existe
    await fs.mkdir(logicDir, { recursive: true });

    const files = await fs.readdir(logicDir);
    const logicMap: Record<string, string> = {};

    for (const file of files) {
      if (file.endsWith('.js')) {
        const content = await fs.readFile(path.join(logicDir, file), 'utf-8');
        logicMap[file] = content;
      }
    }

    return NextResponse.json({ logic: logicMap });
  } catch (error) {
    console.error('[API_LOGIC] Fallo al cargar bóveda de comportamiento:', error);
    return NextResponse.json({ logic: {}, error: 'Logic Vault unreachable' }, { status: 500 });
  }
}
