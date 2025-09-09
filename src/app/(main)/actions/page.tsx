import { getUser, getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ActionsPage from '@/components/ActionsPage';

export default async function Actions() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(user.id);
  const timezone = profile?.timezone || 'UTC';

  return <ActionsPage timezone={timezone} />;
}
