import { getUser, getProfile, createProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';
import { shouldShowMonthlyReview } from '@/lib/date';
import MonthlyReviewDialog from '@/components/MonthlyReviewDialog';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  let profile = await getProfile(user.id);
  
  if (!profile) {
    profile = await createProfile(user.id);
    if (!profile) {
      redirect('/login');
    }
  }

  // Check if onboarding is complete
  if (!profile.onboardingCompleted) {
    redirect('/onboarding');
  }

  // Check if we should show monthly review
  const showMonthlyReview = shouldShowMonthlyReview(profile.lastMonthlyReviewAt);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav user={user} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      {showMonthlyReview && (
        <MonthlyReviewDialog 
          userId={user.id}
          lastReviewDate={profile.lastMonthlyReviewAt}
        />
      )}
    </div>
  );
}
