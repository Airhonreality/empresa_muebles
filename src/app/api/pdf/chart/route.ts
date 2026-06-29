import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { config, width = 800, height = 400 } = await req.json();

    if (!config) {
      return NextResponse.json({ error: 'config is required' }, { status: 400 });
    }

    const { ChartJSNodeCanvas } = await import('chartjs-node-canvas').catch(() => {
      throw new Error('PDF chart renderer is not installed');
    });
    const renderer = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    const buffer = await renderer.renderToBuffer(config);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[/api/pdf/chart]', err);
    const status = err.message === 'PDF chart renderer is not installed' ? 503 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
