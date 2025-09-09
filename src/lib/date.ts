export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

// Timezone mapping for common abbreviations
const TIMEZONE_MAP: Record<string, string> = {
  'PST': 'America/Los_Angeles',
  'PDT': 'America/Los_Angeles',
  'EST': 'America/New_York',
  'EDT': 'America/New_York',
  'CST': 'America/Chicago',
  'CDT': 'America/Chicago',
  'MST': 'America/Denver',
  'MDT': 'America/Denver',
  'UTC': 'UTC',
  'GMT': 'UTC',
};

export function normalizeTimezone(timezone: string): string {
  return TIMEZONE_MAP[timezone.toUpperCase()] || timezone;
}

export function formatDateInTimezone(date: Date | string, timezone: string = 'UTC'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const normalizedTimezone = normalizeTimezone(timezone);
  
  // Use Intl.DateTimeFormat to format the date in the specified timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: normalizedTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(d);
}

export function getToday(timezone: string = 'UTC'): string {
  return formatDateInTimezone(new Date(), timezone);
}

export function getTomorrow(timezone: string = 'UTC'): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateInTimezone(tomorrow, timezone);
}

export function getYesterday(timezone: string = 'UTC'): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateInTimezone(yesterday, timezone);
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
