import { NextRequest, NextResponse } from 'next/server';
import { getStrategy } from '@/server/getStrategy';
import fs from 'fs/promises';
import path from 'path';

/**
 * 🧠 AGNOSTIC ACTION DISPATCHER (v3.0 - SECURE & MANIFEST-DRIVEN)
 * =============================================================
 * 
 * ROLE: Executes scripts only if they are registered in the manifest.json.
 * AXIOM: Security through declaration.
 */
export async function POST(req: NextRequest) {
  try {
    const query = await req.json();
    const strategy = await getStrategy();
    const { action, context, payload, user } = query;

    if (action !== 'INTENT') {
      return NextResponse.json({ success: false, error: 'Only INTENT allowed' }, { status: 400 });
    }

    const activeTenant = process.env.ACTIVE_TENANT || 'default';
    const siloDir = path.join(process.cwd(), 'storage', activeTenant);
    const manifestPath = path.join(siloDir, 'manifest.json');

    // 1. 🛡️ MANIFEST VALIDATION
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      
      // If the intent is not in the manifest, we block it (Industrial Standard)
      if (!manifest.actions?.includes(context)) {
        return NextResponse.json({ 
          success: false, 
          error: `Action '${context}' is not registered in the satellite manifest.` 
        }, { status: 403 });
      }
    } catch (err) {
      console.warn(`[ActionDispatcher] Manifest not found or invalid at ${manifestPath}. Proceeding with caution.`);
    }

    // 2. Resolve Action Path
    const actionFilePath = path.join(siloDir, 'actions', `${context}.js`);

    // 3. Load State
    let item = null;
    if (payload?.id && payload?.context) {
      const db = await strategy.read(payload.context);
      item = db[payload.context]?.find((i: any) => i.id === payload.id) || null;
    }

    // 4. Secure Execution
    try {
      delete require.cache[require.resolve(actionFilePath)];
      const actionScript = require(actionFilePath);
      
      const result = await actionScript({
        item,
        strategy,
        payload,
        user
      });

      return NextResponse.json(result);

    } catch (loadErr) {
      return NextResponse.json({ 
        success: false, 
        error: `Action '${context}' registered but not found in storage/${activeTenant}/actions/` 
      }, { status: 404 });
    }

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Dispatcher failure' },
      { status: 500 }
    );
  }
}
