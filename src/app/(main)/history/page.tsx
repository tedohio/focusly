import { getUser, getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HistoryPage from '@/components/HistoryPage';

export default async function History() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(user.id);
  const timezone = profile?.timezone || 'UTC';

  return <HistoryPage timezone={timezone} />;
}
