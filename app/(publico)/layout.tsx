import { AppShell } from '@/components/veta/app-shell'
import { obtenerPrecioAsesoria3dAction } from '@/lib/data/actions/public'

export default async function PublicoLayout({ children }: { children: React.ReactNode }) {
  const precio3d = (await obtenerPrecioAsesoria3dAction()) || 130000;
  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio3d || 130000);

  return <AppShell precio3dFormatted={formattedPrice}>{children}</AppShell>
}
