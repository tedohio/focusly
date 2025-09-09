'use server';

import { db } from '@/db/drizzle';
import { todos } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export async function getTodos() {
  const user = await requireAuth();
  
  const userTodos = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, user.id))
    .orderBy(desc(todos.forDate), todos.order);

  return userTodos;
}
