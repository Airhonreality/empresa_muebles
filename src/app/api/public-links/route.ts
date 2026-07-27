import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicLink, revokePublicLink, PUBLIC_LINKS_NAMESPACE } from '@/server/public-links';
import { getStrategy } from '@/server/getStrategy';
import { requireManagementAccess } from '@/lib/agnostic/require-session';

const fieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().min(1).max(120),
  format: z.enum(['text', 'currency', 'number', 'date', 'boolean']).optional(),
});

const createSchema = z.object({
  action: z.literal('CREATE'),
  context: z.string().regex(/^[a-z][a-z0-9_]*$/),
  record_id: z.string().min(1),
  fields: z.array(fieldSchema).min(1).max(50),
  title: z.string().min(1).max(160).optional(),
  proposal_slug_base: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'proposal_slug_base must be lowercase kebab-case',
  }).min(3).max(80).optional(),
  expires_at: z.string().datetime().optional(),
}).superRefine((value, ctx) => {
  if (new Set(value.fields.map(field => field.key)).size !== value.fields.length) {
    ctx.addIssue({ code: 'custom', message: 'fields must not contain duplicate keys' });
  }
});

const revokeSchema = z.object({ action: z.literal('REVOKE'), id: z.string().min(1) });

export async function GET(request: NextRequest) {
  try {
    await requireManagementAccess(request);
  } catch {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }
  const links = await getStrategy().read(PUBLIC_LINKS_NAMESPACE);
  return NextResponse.json({
    success: true,
    records: links.map(({ data, ...link }) => ({ ...link, data: { ...data, token_hash: undefined } })),
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireManagementAccess(request);
    const body = await request.json();
    if (body.action === 'CREATE') {
      const { action: _action, proposal_slug_base, ...input } = createSchema.parse(body);
      const { token, id, public_slug } = await createPublicLink(input, proposal_slug_base);
      const path = public_slug ? `/propuesta/${public_slug}` : `/share/${token}`;
      return NextResponse.json({ success: true, id, url: new URL(path, request.url).toString() }, { status: 201 });
    }
    const { id } = revokeSchema.parse(body);
    if (!await revokePublicLink(id)) return NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTHENTICATION_REQUIRED') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 });
  }
}
