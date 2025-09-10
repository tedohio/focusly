import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ActionsPage from '@/components/ActionsPage';

export default async function Actions() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  return <ActionsPage />;
}
