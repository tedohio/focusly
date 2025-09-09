'use server';

import { db } from '@/db/drizzle';
import { longTermGoals, focusAreas, monthlyGoals } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { longTermGoalSchema, focusAreaSchema, monthlyGoalSchema } from '@/lib/validators';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Long-term Goals
export async function getLongTermGoals() {
  const user = await requireAuth();
  
  const goals = await db
    .select()
    .from(longTermGoals)
    .where(eq(longTermGoals.userId, user.id))
    .orderBy(desc(longTermGoals.createdAt));

  return goals;
}

export async function createLongTermGoal(data: {
  title: string;
  description?: string;
  targetYears: number;
}) {
  const user = await requireAuth();
  
  const validatedData = longTermGoalSchema.parse(data);

  // Delete existing long-term goal (enforce 1 per user)
  await db
    .delete(longTermGoals)
    .where(eq(longTermGoals.userId, user.id));

  const newGoal = await db
    .insert(longTermGoals)
    .values({
      ...validatedData,
      userId: user.id,
    })
    .returning();

  revalidatePath('/goals');
  revalidatePath('/');
  return newGoal[0];
}

export async function updateLongTermGoal(id: string, data: Partial<{
  title: string;
  description: string;
  targetYears: number;
}>) {
  const user = await requireAuth();
  
  const updatedGoal = await db
    .update(longTermGoals)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(longTermGoals.id, id), eq(longTermGoals.userId, user.id)))
    .returning();

  revalidatePath('/goals');
  revalidatePath('/');
  return updatedGoal[0];
}

// Focus Areas
export async function getFocusAreas() {
  const user = await requireAuth();
  
  const areas = await db
    .select()
    .from(focusAreas)
    .where(eq(focusAreas.userId, user.id))
    .orderBy(focusAreas.order);

  return areas;
}

export async function createFocusAreas(data: Array<{
  title: string;
  description?: string;
  order: number;
}>) {
  const user = await requireAuth();
  
  // Validate all focus areas
  const validatedData = data.map(item => focusAreaSchema.parse(item));

  // Delete existing focus areas
  await db
    .delete(focusAreas)
    .where(eq(focusAreas.userId, user.id));

  // Insert new focus areas
  const newAreas = await db
    .insert(focusAreas)
    .values(validatedData.map(item => ({
      ...item,
      userId: user.id,
    })))
    .returning();

  revalidatePath('/goals');
  revalidatePath('/');
  return newAreas;
}

export async function updateFocusArea(id: string, data: Partial<{
  title: string;
  description: string;
  order: number;
}>) {
  const user = await requireAuth();
  
  const updatedArea = await db
    .update(focusAreas)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(focusAreas.id, id), eq(focusAreas.userId, user.id)))
    .returning();

  revalidatePath('/goals');
  revalidatePath('/');
  return updatedArea[0];
}

export async function deleteFocusArea(id: string) {
  const user = await requireAuth();
  
  await db
    .delete(focusAreas)
    .where(and(eq(focusAreas.id, id), eq(focusAreas.userId, user.id)));

  revalidatePath('/goals');
  revalidatePath('/');
}

// Monthly Goals
export async function getMonthlyGoals() {
  const user = await requireAuth();
  
  const goals = await db
    .select()
    .from(monthlyGoals)
    .where(eq(monthlyGoals.userId, user.id))
    .orderBy(desc(monthlyGoals.year), desc(monthlyGoals.month), monthlyGoals.order);

  return goals;
}

export async function createMonthlyGoals(data: Array<{
  title: string;
  month: number;
  year: number;
  order: number;
}>) {
  const user = await requireAuth();
  
  // Validate all monthly goals
  const validatedData = data.map(item => monthlyGoalSchema.parse(item));

  // Delete existing monthly goals for this month/year
  const firstGoal = validatedData[0];
  if (firstGoal) {
    await db
      .delete(monthlyGoals)
      .where(and(
        eq(monthlyGoals.userId, user.id),
        eq(monthlyGoals.month, firstGoal.month),
        eq(monthlyGoals.year, firstGoal.year)
      ));
  }

  // Insert new monthly goals
  const newGoals = await db
    .insert(monthlyGoals)
    .values(validatedData.map(item => ({
      ...item,
      userId: user.id,
      status: 'active' as const,
    })))
    .returning();

  revalidatePath('/goals');
  revalidatePath('/');
  return newGoals;
}

export async function updateMonthlyGoal(id: string, data: Partial<{
  title: string;
  order: number;
  status: 'active' | 'done' | 'dropped';
}>) {
  const user = await requireAuth();
  
  const updatedGoal = await db
    .update(monthlyGoals)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(monthlyGoals.id, id), eq(monthlyGoals.userId, user.id)))
    .returning();

  revalidatePath('/goals');
  revalidatePath('/');
  return updatedGoal[0];
}

export async function deleteMonthlyGoal(id: string) {
  const user = await requireAuth();
  
  await db
    .delete(monthlyGoals)
    .where(and(eq(monthlyGoals.id, id), eq(monthlyGoals.userId, user.id)));

  revalidatePath('/goals');
  revalidatePath('/');
}

export async function reorderMonthlyGoals(goalIds: string[]) {
  const user = await requireAuth();
  
  // Update order for each goal
  for (let i = 0; i < goalIds.length; i++) {
    await db
      .update(monthlyGoals)
      .set({
        order: (i + 1) * 100,
        updatedAt: new Date(),
      })
      .where(and(eq(monthlyGoals.id, goalIds[i]), eq(monthlyGoals.userId, user.id)));
  }

  revalidatePath('/goals');
  revalidatePath('/');
}
