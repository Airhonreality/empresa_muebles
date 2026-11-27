import { AppShell } from '@/components/veta/app-shell'
import { obtenerPrecioAsesoria3dAction } from '@/lib/data/actions/public'
import { formatearPrecioAsesoria3d } from '@/lib/utils/format'

export default async function PublicoLayout({ children }: { children: React.ReactNode }) {
  const formattedPrice = formatearPrecioAsesoria3d(await obtenerPrecioAsesoria3dAction());

  return <AppShell precio3dFormatted={formattedPrice}>{children}</AppShell>
}
