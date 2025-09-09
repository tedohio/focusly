import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import GoalsPage from '@/components/GoalsPage';

export default async function Goals() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  return <GoalsPage />;
}
