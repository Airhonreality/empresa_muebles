import type { Metadata } from 'next'
import { ErpShell } from '@/components/veta/erp-shell'

export const metadata: Metadata = {
  title: 'ERP — Veta Dorada',
  robots: 'noindex, nofollow',
}

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return <ErpShell>{children}</ErpShell>
}
