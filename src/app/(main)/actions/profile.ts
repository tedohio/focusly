'use server';

import { db } from '@/db/drizzle';
import { profiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { profileSchema } from '@/lib/validators';
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
  
  const validatedData = profileSchema.parse(data);

  const updatedProfile = await db
    .update(profiles)
    .set({
      ...validatedData,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id))
    .returning();

  revalidatePath('/');
  revalidatePath('/settings');
  return updatedProfile[0];
}

export async function completeOnboarding() {
  const user = await requireAuth();
  
  const updatedProfile = await db
    .update(profiles)
    .set({
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id))
    .returning();

  revalidatePath('/');
  revalidatePath('/onboarding');
  return updatedProfile[0];
}
