import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStrategy } from '@/server/getStrategy';

const leadSchema = z.object({
  nombre_completo: z.string().trim().min(2).max(120),
  telefono_whatsapp: z.string().trim().min(7).max(32).regex(/^[0-9+()\-\s]+$/),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  barrio_zona: z.string().trim().max(120).optional().or(z.literal('')),
  tipo_espacio: z.enum(['Cocina', 'Closet', 'Centro de TV', 'Oficina', 'Otro']),
  estado_proyecto: z.enum(['Tengo diseño y medidas', 'Necesito que me visiten y asesoren']),
  mensaje: z.string().trim().max(1500).optional().or(z.literal('')),
  gclid: z.string().trim().max(256).optional().or(z.literal('')),
  utm_source: z.string().trim().max(128).optional().or(z.literal('')),
  utm_medium: z.string().trim().max(128).optional().or(z.literal('')),
  utm_campaign: z.string().trim().max(128).optional().or(z.literal('')),
});

const submissions = new Map<string, { count: number; resetsAt: number }>();
const WINDOW_MS = 60_000;
const MAX_SUBMISSIONS = 5;

function allowsSubmission(request: NextRequest) {
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const entry = submissions.get(address);
  if (!entry || entry.resetsAt <= now) {
    submissions.set(address, { count: 1, resetsAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_SUBMISSIONS) return false;
  entry.count += 1;
  return true;
}

/** Public write boundary. It accepts only the approved lead projection and never reads leads. */
export async function POST(request: NextRequest) {
  if (!allowsSubmission(request)) return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 });
  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Revisa los campos obligatorios.' }, { status: 400 });

  const data = parsed.data;
  await getStrategy().write('leads', {
    id: crypto.randomUUID(),
    context: 'leads',
    data: {
      ...data,
      email: data.email || '',
      barrio_zona: data.barrio_zona || '',
      mensaje: data.mensaje || '',
      gclid: data.gclid || '',
      utm_source: data.utm_source || '',
      utm_medium: data.utm_medium || '',
      utm_campaign: data.utm_campaign || '',
    },
  });

  const destination = (process.env.PUBLIC_WHATSAPP_NUMBER || '573001234567').replace(/\D/g, '');
  const message = `Hola Veta Dorada, soy ${data.nombre_completo}. Necesito un proyecto de ${data.tipo_espacio}. ${data.estado_proyecto}.`;
  return NextResponse.json({ success: true, whatsapp_url: `https://wa.me/${destination}?text=${encodeURIComponent(message)}` }, { status: 201 });
}
