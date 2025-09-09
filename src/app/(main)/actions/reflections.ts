'use server';

import { db } from '@/db/drizzle';
import { reflections } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { reflectionSchema } from '@/lib/validators';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getReflections() {
  const user = await requireAuth();
  
  const userReflections = await db
    .select()
    .from(reflections)
    .where(eq(reflections.userId, user.id))
    .orderBy(desc(reflections.forDate), desc(reflections.createdAt));

  return userReflections;
}

export async function getReflection(forDate: string) {
  const user = await requireAuth();
  
  const reflection = await db
    .select()
    .from(reflections)
    .where(and(eq(reflections.userId, user.id), eq(reflections.forDate, forDate)))
    .limit(1);

  return reflection[0] || null;
}

export async function createReflection(data: {
  whatWentWell?: string;
  whatDidntGoWell?: string;
  improvements?: string;
  forDate: string;
  isMonthly?: boolean;
}) {
  const user = await requireAuth();
  
  const validatedData = reflectionSchema.parse(data);

  // Check if reflection already exists for this date
  const existing = await getReflection(data.forDate);
  
  if (existing) {
    // Update existing reflection
    const updatedReflection = await db
      .update(reflections)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(eq(reflections.id, existing.id), eq(reflections.userId, user.id)))
      .returning();

    revalidatePath('/history');
    revalidatePath('/actions');
    return updatedReflection[0];
  } else {
    // Create new reflection
    const newReflection = await db
      .insert(reflections)
      .values({
        ...validatedData,
        userId: user.id,
      })
      .returning();

    revalidatePath('/history');
    revalidatePath('/actions');
    return newReflection[0];
  }
}

export async function updateReflection(id: string, data: Partial<{
  whatWentWell: string;
  whatDidntGoWell: string;
  improvements: string;
}>) {
  const user = await requireAuth();
  
  const updatedReflection = await db
    .update(reflections)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(reflections.id, id), eq(reflections.userId, user.id)))
    .returning();

  revalidatePath('/history');
  revalidatePath('/actions');
  return updatedReflection[0];
}

export async function deleteReflection(id: string) {
  const user = await requireAuth();
  
  await db
    .delete(reflections)
    .where(and(eq(reflections.id, id), eq(reflections.userId, user.id)));

  revalidatePath('/history');
  revalidatePath('/actions');
}
