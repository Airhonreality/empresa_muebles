import type { Metadata } from 'next';
import PublicAppointment from '@/components/specialized/public/PublicAppointment';
import { buildMetadata, getSiteIdentity } from '@/lib/seo/metadata-helpers';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  return buildMetadata({
    title: 'Agenda tu Visita de Diseño en Bogotá',
    description:
      'Solicita una visita a tu proyecto en Bogotá. Recibe asesoría personalizada, diseño 3D y cotización sin compromiso para cocinas, closets y muebles a medida.',
    canonical: `${identity.siteUrl}/agendar`,
  });
}

export default function AppointmentPage() { return <PublicAppointment />; }
