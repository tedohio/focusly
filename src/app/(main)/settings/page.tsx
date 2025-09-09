import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SettingsPage from '@/components/SettingsPage';

export default async function Settings() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  return <SettingsPage user={user} />;
}
