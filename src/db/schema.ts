import { pgTable, uuid, text, boolean, timestamp, date, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const monthlyGoalStatusEnum = pgEnum('monthly_goal_status', ['active', 'done', 'dropped']);

// Tables
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  lastMonthlyReviewAt: date('last_monthly_review_at'),
  timezone: text('timezone').default('UTC').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const longTermGoals = pgTable('long_term_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  targetYears: integer('target_years').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const focusAreas = pgTable('focus_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const monthlyGoals = pgTable('monthly_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  order: integer('order').notNull(),
  status: monthlyGoalStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  dueDate: date('due_date'),
  order: integer('order').notNull(),
  done: boolean('done').default(false).notNull(),
  forDate: date('for_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  forDate: date('for_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reflections = pgTable('reflections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  whatWentWell: text('what_went_well'),
  whatDidntGoWell: text('what_didnt_go_well'),
  improvements: text('improvements'),
  forDate: date('for_date').notNull(),
  isMonthly: boolean('is_monthly').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  longTermGoals: many(longTermGoals),
  focusAreas: many(focusAreas),
  monthlyGoals: many(monthlyGoals),
  todos: many(todos),
  notes: many(notes),
  reflections: many(reflections),
}));

export const longTermGoalsRelations = relations(longTermGoals, ({ one }) => ({
  profile: one(profiles, {
    fields: [longTermGoals.userId],
    references: [profiles.userId],
  }),
}));

export const focusAreasRelations = relations(focusAreas, ({ one }) => ({
  profile: one(profiles, {
    fields: [focusAreas.userId],
    references: [profiles.userId],
  }),
}));

export const monthlyGoalsRelations = relations(monthlyGoals, ({ one }) => ({
  profile: one(profiles, {
    fields: [monthlyGoals.userId],
    references: [profiles.userId],
  }),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  profile: one(profiles, {
    fields: [todos.userId],
    references: [profiles.userId],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  profile: one(profiles, {
    fields: [notes.userId],
    references: [profiles.userId],
  }),
}));

export const reflectionsRelations = relations(reflections, ({ one }) => ({
  profile: one(profiles, {
    fields: [reflections.userId],
    references: [profiles.userId],
  }),
}));

// Types
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type LongTermGoal = typeof longTermGoals.$inferSelect;
export type NewLongTermGoal = typeof longTermGoals.$inferInsert;
export type FocusArea = typeof focusAreas.$inferSelect;
export type NewFocusArea = typeof focusAreas.$inferInsert;
export type MonthlyGoal = typeof monthlyGoals.$inferSelect;
export type NewMonthlyGoal = typeof monthlyGoals.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Reflection = typeof reflections.$inferSelect;
export type NewReflection = typeof reflections.$inferInsert;
