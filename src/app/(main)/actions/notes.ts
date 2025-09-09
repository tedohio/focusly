'use server';

import { db } from '@/db/drizzle';
import { notes } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { noteSchema } from '@/lib/validators';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getNotes() {
  const user = await requireAuth();
  
  const userNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.forDate), desc(notes.createdAt));

  return userNotes;
}

export async function getNote(forDate: string) {
  const user = await requireAuth();
  
  const note = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, user.id), eq(notes.forDate, forDate)))
    .limit(1);

  return note[0] || null;
}

export async function createNote(data: {
  content: string;
  forDate: string;
}) {
  const user = await requireAuth();
  
  const validatedData = noteSchema.parse(data);

  // Check if note already exists for this date
  const existing = await getNote(data.forDate);
  
  if (existing) {
    // Update existing note
    const updatedNote = await db
      .update(notes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, existing.id), eq(notes.userId, user.id)))
      .returning();

    revalidatePath('/history');
    revalidatePath('/actions');
    return updatedNote[0];
  } else {
    // Create new note
    const newNote = await db
      .insert(notes)
      .values({
        ...validatedData,
        userId: user.id,
      })
      .returning();

    revalidatePath('/history');
    revalidatePath('/actions');
    return newNote[0];
  }
}

export async function updateNote(id: string, data: Partial<{
  content: string;
}>) {
  const user = await requireAuth();
  
  const updatedNote = await db
    .update(notes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .returning();

  revalidatePath('/history');
  revalidatePath('/actions');
  return updatedNote[0];
}

export async function deleteNote(id: string) {
  const user = await requireAuth();
  
  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

  revalidatePath('/history');
  revalidatePath('/actions');
}
