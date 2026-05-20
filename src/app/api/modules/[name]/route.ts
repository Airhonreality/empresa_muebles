/**
 * 🛡️ AGNOSTICISM GUARDIAN: MODULE DISPATCHER (v2.0 - UNIVERSAL)
 * ==========================================================
 * 
 * ROLE: Delivers Business Logic scripts (.js) to the Satellite at runtime.
 * CAPABILITY: Supports Local Disk and Remote HTTP fetching.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSiloPath } from '@/server/activeProject';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const storageUrl = process.env.STORAGE_URL;
    
    /**
     * 🛰️ REMOTE MODULE LOADING
     */
    if (storageUrl) {
      const remoteUrl = `${storageUrl.endsWith('/') ? storageUrl.slice(0, -1) : storageUrl}/modules/${name}.js`;
      try {
        const response = await fetch(remoteUrl);
        if (response.ok) {
          const content = await response.text();
          return new NextResponse(content, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      } catch (err) {
        console.error(`[ModuleDispatcher] Remote fetch failed for ${name}:`, err);
      }
    }

    /**
     * 🏠 LOCAL MODULE LOADING (Default)
     */
    const moduleDir = path.join(getSiloPath(), 'modules');
    const modulePath = path.join(moduleDir, `${name}.js`);
    
    try {
      const content = await fs.readFile(modulePath, 'utf-8');
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    } catch (e) {
      // Fallback: search for alias in local directory
      try {
        const files = await fs.readdir(moduleDir);
        const aliasedFile = files.find(f => 
          f.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(f.replace('.js', '').toLowerCase())
        );
        
        if (aliasedFile) {
          const content = await fs.readFile(path.join(moduleDir, aliasedFile), 'utf-8');
          return new NextResponse(content, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      } catch (scanErr) { /* ignore scan err */ }
      
      return NextResponse.json({ error: `Module '${name}' not found` }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
