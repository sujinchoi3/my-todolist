import { getTodayKST, calcIsOverdue } from '../../utils/kst';

describe('getTodayKST', () => {
  it('should return a string in YYYY-MM-DD format', () => {
    const result = getTodayKST();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return today in KST timezone', () => {
    const result = getTodayKST();
    const date = new Date(result);
    expect(date).toBeInstanceOf(Date);
    expect(isNaN(date.getTime())).toBe(false);
  });
});

describe('calcIsOverdue', () => {
  it('should return true when status is pending and due_date is in the past', () => {
    expect(calcIsOverdue('2020-01-01', 'pending')).toBe(true);
  });

  it('should return false when status is completed even if due_date is in the past', () => {
    expect(calcIsOverdue('2020-01-01', 'completed')).toBe(false);
  });

  it('should return false when due_date is today', () => {
    const today = getTodayKST();
    expect(calcIsOverdue(today, 'pending')).toBe(false);
  });

  it('should return false when due_date is in the future', () => {
    expect(calcIsOverdue('2099-12-31', 'pending')).toBe(false);
  });
});
