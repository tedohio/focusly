import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HistoryPage from '@/components/HistoryPage';

export default async function History() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  return <HistoryPage />;
}
