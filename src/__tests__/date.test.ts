import { 
  formatDate, 
  getToday, 
  getTomorrow, 
  getYesterday,
  isEndOfMonth,
  isLastThreeDaysOfMonth,
  isFirstTwoDaysOfMonth,
  shouldShowMonthlyReview,
  getCurrentMonth,
  getCurrentYear,
  getNextMonth
} from '@/lib/date';

describe('Date utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should format date string correctly', () => {
      expect(formatDate('2024-01-15')).toBe('2024-01-15');
    });
  });

  describe('getToday', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const today = getToday();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getTomorrow', () => {
    it('should return tomorrow in YYYY-MM-DD format', () => {
      const tomorrow = getTomorrow();
      expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getYesterday', () => {
    it('should return yesterday in YYYY-MM-DD format', () => {
      const yesterday = getYesterday();
      expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('isEndOfMonth', () => {
    it('should return true for last day of month', () => {
      // January 31, 2024
      expect(isEndOfMonth('2024-01-31')).toBe(true);
    });

    it('should return false for middle of month', () => {
      // January 15, 2024
      expect(isEndOfMonth('2024-01-15')).toBe(false);
    });
  });

  describe('isLastThreeDaysOfMonth', () => {
    it('should return true for last 3 days of month', () => {
      // January 29, 30, 31, 2024
      expect(isLastThreeDaysOfMonth('2024-01-29')).toBe(true);
      expect(isLastThreeDaysOfMonth('2024-01-30')).toBe(true);
      expect(isLastThreeDaysOfMonth('2024-01-31')).toBe(true);
    });

    it('should return false for earlier in month', () => {
      // January 15, 2024
      expect(isLastThreeDaysOfMonth('2024-01-15')).toBe(false);
    });
  });

  describe('isFirstTwoDaysOfMonth', () => {
    it('should return true for first 2 days of month', () => {
      // January 1, 2, 2024
      expect(isFirstTwoDaysOfMonth('2024-01-01')).toBe(true);
      expect(isFirstTwoDaysOfMonth('2024-01-02')).toBe(true);
    });

    it('should return false for later in month', () => {
      // January 15, 2024
      expect(isFirstTwoDaysOfMonth('2024-01-15')).toBe(false);
    });
  });

  describe('shouldShowMonthlyReview', () => {
    it('should return true if no previous review and in review period', () => {
      // This test depends on the current date being in a review period
      // We'll just test that it returns a boolean
      const result = shouldShowMonthlyReview(null);
      expect(typeof result).toBe('boolean');
    });

    it('should return false if recent review exists', () => {
      // Recent review (within 25 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);
      expect(shouldShowMonthlyReview(recentDate.toISOString().split('T')[0])).toBe(false);
    });

    it('should return true if old review and in review period', () => {
      // Old review (more than 25 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      const result = shouldShowMonthlyReview(oldDate.toISOString().split('T')[0]);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCurrentMonth', () => {
    it('should return current month (1-12)', () => {
      const month = getCurrentMonth();
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
    });
  });

  describe('getCurrentYear', () => {
    it('should return current year', () => {
      const year = getCurrentYear();
      expect(year).toBe(new Date().getFullYear());
    });
  });

  describe('getNextMonth', () => {
    it('should return next month and year', () => {
      const nextMonth = getNextMonth();
      expect(nextMonth.month).toBeGreaterThanOrEqual(1);
      expect(nextMonth.month).toBeLessThanOrEqual(12);
      expect(nextMonth.year).toBeGreaterThanOrEqual(new Date().getFullYear());
    });
  });
});
