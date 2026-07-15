import { notFound } from 'next/navigation'
import PublicProposal from '@/components/specialized/public/PublicProposal'
import { getPublicProposal } from '@/server/public-proposal'
export const dynamic = 'force-dynamic'
export default async function ProposalPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const proposal = await getPublicProposal(slug); if (!proposal) notFound(); return <PublicProposal proposal={proposal} /> }
