'use server';

import { db } from '@/db/drizzle';
import { profiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
// import { profileSchema } from '@/lib/validators';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getProfile() {
  const user = await requireAuth();
  
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  return profile[0] || null;
}

export async function updateProfile(data: Partial<{
  onboardingCompleted: boolean;
  lastMonthlyReviewAt: string;
  timezone: string;
}>) {
  const user = await requireAuth();
  
  // Only validate and include fields that are actually provided
  const updateData: Partial<typeof profiles.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.onboardingCompleted !== undefined) {
    updateData.onboardingCompleted = data.onboardingCompleted;
  }
  
  if (data.lastMonthlyReviewAt !== undefined) {
    updateData.lastMonthlyReviewAt = data.lastMonthlyReviewAt;
  }
  
  if (data.timezone !== undefined) {
    updateData.timezone = data.timezone;
  }

  const updatedProfile = await db
    .update(profiles)
    .set(updateData)
    .where(eq(profiles.userId, user.id))
    .returning();

  revalidatePath('/');
  revalidatePath('/settings');
  return updatedProfile[0];
}

export async function completeOnboarding(data: { timezone: string }) {
  const user = await requireAuth();
  
  console.log('Completing onboarding for user:', user.id, 'with timezone:', data.timezone);
  
  // First, try to update existing profile
  const updatedProfile = await db
    .update(profiles)
    .set({
      onboardingCompleted: true,
      timezone: data.timezone,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id))
    .returning();

  console.log('Updated profile result:', updatedProfile);

  // If no profile exists, create one with onboarding completed
  if (updatedProfile.length === 0) {
    console.log('No existing profile found, creating new one');
    const newProfile = await db
      .insert(profiles)
      .values({
        userId: user.id,
        onboardingCompleted: true,
        timezone: data.timezone,
      })
      .returning();
    
    console.log('Created new profile:', newProfile);
    revalidatePath('/');
    revalidatePath('/onboarding');
    return newProfile[0];
  }

  console.log('Updated existing profile:', updatedProfile[0]);
  revalidatePath('/');
  revalidatePath('/onboarding');
  return updatedProfile[0];
}
