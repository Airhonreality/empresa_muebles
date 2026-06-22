import { AgnosticRoutePage } from './agnostic-route-page';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return <AgnosticRoutePage slug={[]} />;
}
