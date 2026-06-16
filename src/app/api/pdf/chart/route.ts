import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Requires: npm install chartjs-node-canvas
// On Windows: also requires node-gyp build tools (npm install --global windows-build-tools)
export async function POST(req: NextRequest) {
  try {
    const { config, width = 800, height = 400 } = await req.json();

    if (!config) {
      return NextResponse.json({ error: 'config is required' }, { status: 400 });
    }

    const { ChartJSNodeCanvas } = await import('chartjs-node-canvas');
    const renderer = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    const buffer = await renderer.renderToBuffer(config);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[/api/pdf/chart]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
