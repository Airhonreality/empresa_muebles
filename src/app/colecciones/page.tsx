import PublicCollections from '@/components/specialized/public/PublicCollections';

export const dynamic = 'force-dynamic';
export const metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function CollectionsPage() { return <PublicCollections />; }
