export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function getToday(timezone: string = 'UTC'): string {
  return formatDate(new Date());
}

export function getTomorrow(timezone: string = 'UTC'): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

export function getYesterday(timezone: string = 'UTC'): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

export function isEndOfMonth(date: Date | string = new Date()): boolean {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const tomorrow = new Date(d);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return d.getMonth() !== tomorrow.getMonth();
}

export function isLastThreeDaysOfMonth(date: Date | string = new Date()): boolean {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const currentDay = d.getDate();
  
  return currentDay >= lastDay - 2;
}

export function isFirstTwoDaysOfMonth(date: Date | string = new Date()): boolean {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.getDate() <= 2;
}

export function shouldShowMonthlyReview(lastReviewDate: string | null): boolean {
  const today = new Date();
  const lastReview = lastReviewDate ? new Date(lastReviewDate) : null;
  
  // Check if it's been more than 25 days since last review
  const daysSinceLastReview = lastReview 
    ? Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  
  const isEndOfMonthPeriod = isLastThreeDaysOfMonth(today);
  const isStartOfMonthPeriod = isFirstTwoDaysOfMonth(today);
  
  return (isEndOfMonthPeriod || isStartOfMonthPeriod) && daysSinceLastReview > 25;
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getNextMonth(): { month: number; year: number } {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  return {
    month: nextMonth.getMonth() + 1,
    year: nextMonth.getFullYear(),
  };
}
