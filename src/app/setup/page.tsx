import { redirect } from 'next/navigation';

// Silo selection was removed — forks have a single hardcoded storage/.
export default function SetupPage() {
  redirect('/schema');
}
