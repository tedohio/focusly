import { z } from 'zod';

export const longTermGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  targetYears: z.number().min(1, 'Target years must be at least 1').max(10, 'Target years must be at most 10'),
});

export const focusAreaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  order: z.number().min(0),
});

export const monthlyGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  order: z.number().min(0),
  status: z.enum(['active', 'done', 'dropped']).default('active'),
});

export const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  dueDate: z.string().optional(),
  order: z.number().min(0),
  done: z.boolean().default(false),
  forDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const noteSchema = z.object({
  content: z.string().max(5000, 'Note must be less than 5000 characters'),
  forDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const reflectionSchema = z.object({
  whatWentWell: z.string().optional(),
  whatDidntGoWell: z.string().optional(),
  improvements: z.string().optional(),
  forDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  isMonthly: z.boolean().default(false),
});

export const profileSchema = z.object({
  onboardingCompleted: z.boolean().default(false),
  lastMonthlyReviewAt: z.string().optional(),
  timezone: z.string().default('UTC'),
});

// Validation helpers
export function validateFocusAreas(focusAreas: Array<{ title: string; description?: string }>): { valid: boolean; error?: string } {
  if (focusAreas.length < 3) {
    return { valid: false, error: 'You must have at least 3 focus areas' };
  }
  if (focusAreas.length > 5) {
    return { valid: false, error: 'You can have at most 5 focus areas' };
  }
  
  const titles = focusAreas.map(fa => fa.title).filter(Boolean);
  if (titles.length !== focusAreas.length) {
    return { valid: false, error: 'All focus areas must have titles' };
  }
  
  return { valid: true };
}

export function validateMonthlyGoals(monthlyGoals: Array<{ title: string }>): { valid: boolean; error?: string } {
  if (monthlyGoals.length < 3) {
    return { valid: false, error: 'You must have at least 3 monthly goals' };
  }
  if (monthlyGoals.length > 5) {
    return { valid: false, error: 'You can have at most 5 monthly goals' };
  }
  
  const titles = monthlyGoals.map(mg => mg.title).filter(Boolean);
  if (titles.length !== monthlyGoals.length) {
    return { valid: false, error: 'All monthly goals must have titles' };
  }
  
  return { valid: true };
}
