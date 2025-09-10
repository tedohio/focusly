'use server';

import { db } from '@/db/drizzle';
import { todos } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { todoSchema } from '@/lib/validators';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getTodos(forDate: string) {
  const user = await requireAuth();
  
  const userTodos = await db
    .select()
    .from(todos)
    .where(and(eq(todos.userId, user.id), eq(todos.forDate, forDate)))
    .orderBy(todos.order);

  return userTodos;
}

export async function createTodo(data: {
  title: string;
  forDate: string;
  dueDate?: string;
}) {
  const user = await requireAuth();
  
  const validatedData = todoSchema.parse({
    ...data,
    order: 0, // Will be updated after getting max order
    done: false,
  });

  // Get the highest order for this date
  const maxOrderResult = await db
    .select({ maxOrder: todos.order })
    .from(todos)
    .where(and(eq(todos.userId, user.id), eq(todos.forDate, data.forDate)))
    .orderBy(desc(todos.order))
    .limit(1);

  const newOrder = (maxOrderResult[0]?.maxOrder || 0) + 100;

  const newTodo = await db
    .insert(todos)
    .values({
      ...validatedData,
      userId: user.id,
      order: newOrder,
    })
    .returning();

  revalidatePath('/');
  return newTodo[0];
}

export async function updateTodo(id: string, data: Partial<{
  title: string;
  done: boolean;
  dueDate: string;
}>) {
  const user = await requireAuth();
  
  const updatedTodo = await db
    .update(todos)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(todos.id, id), eq(todos.userId, user.id)))
    .returning();

  revalidatePath('/');
  return updatedTodo[0];
}

export async function deleteTodo(id: string) {
  const user = await requireAuth();
  
  await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, user.id)));

  revalidatePath('/');
}

export async function reorderTodos(todoIds: string[]) {
  const user = await requireAuth();
  
  // Update order for each todo
  for (let i = 0; i < todoIds.length; i++) {
    await db
      .update(todos)
      .set({
        order: (i + 1) * 100,
        updatedAt: new Date(),
      })
      .where(and(eq(todos.id, todoIds[i]), eq(todos.userId, user.id)));
  }

  revalidatePath('/');
}

export async function duplicateTodoToTomorrow(id: string) {
  const user = await requireAuth();
  
  const todo = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, user.id)))
    .limit(1);

  if (!todo[0]) {
    throw new Error('Todo not found');
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  // Get the highest order for tomorrow
  const maxOrderResult = await db
    .select({ maxOrder: todos.order })
    .from(todos)
    .where(and(eq(todos.userId, user.id), eq(todos.forDate, tomorrowDate)))
    .orderBy(desc(todos.order))
    .limit(1);

  const newOrder = (maxOrderResult[0]?.maxOrder || 0) + 100;

  const newTodo = await db
    .insert(todos)
    .values({
      userId: user.id,
      title: todo[0].title,
      forDate: tomorrowDate,
      order: newOrder,
      done: false,
    })
    .returning();

  revalidatePath('/');
  return newTodo[0];
}
