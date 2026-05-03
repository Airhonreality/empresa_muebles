import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Module Dispatcher API
 * Delivers Business Logic scripts (.js) from storage to the Satellite at runtime.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = await params;
    const storagePath = process.env.STORAGE_PATH || 'storage/default';
    
    // Ensure the file exists in storage/modules
    const modulePath = path.join(process.cwd(), storagePath, 'modules', `${name}.js`);
    
    try {
      const content = await fs.readFile(modulePath, 'utf-8');
      
      // Return as Javascript to be executable by the browser
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    } catch (e) {
      return NextResponse.json({ error: 'Module logic not found' }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
