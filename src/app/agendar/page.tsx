import type { Metadata } from 'next';
import PublicAppointment from '@/components/specialized/public/PublicAppointment';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agenda tu Visita de Diseño en Bogotá | Veta Dorada',
  description:
    'Solicita una visita a tu proyecto en Bogotá. Recibe asesoría personalizada, diseño 3D y cotización sin compromiso para cocinas, closets y muebles a medida.',
};

export default function AppointmentPage() { return <PublicAppointment />; }
