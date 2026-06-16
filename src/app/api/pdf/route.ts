import { NextRequest, NextResponse } from 'next/server';
import { getStrategy } from '@/server/getStrategy';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { template: templateName, inputs = [{}] } = await req.json();

    if (!templateName) {
      return NextResponse.json({ error: 'template is required' }, { status: 400 });
    }

    const tenantKey = req.headers.get('x-tenant') ?? undefined;
    const strategy = getStrategy(tenantKey);

    const records = await strategy.read('pdf_templates');
    const record = records.find((r: any) => r.data?.name === templateName);

    if (!record) {
      return NextResponse.json(
        { error: `Template "${templateName}" not found in pdf_templates namespace` },
        { status: 404 }
      );
    }

    const { generate } = await import('@pdfme/generator');
    const pdfBuffer = await generate({ template: record.data.template, inputs });

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${templateName}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[/api/pdf]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
