import { describe, expect, it } from 'vitest';
import { businessDate, businessMonth, monthRangeUtc } from './time';

describe('múi giờ Asia/Ho_Chi_Minh', () => {
  it('17:00 UTC ngày 31/10 là 00:00 ngày 01/11 giờ Việt Nam', () => {
    const at = new Date('2026-10-31T17:00:00Z');
    expect(businessDate(at)).toBe('2026-11-01');
    expect(businessMonth(at)).toBe('2026-11');
  });
  it('16:59:59 UTC vẫn thuộc tháng trước', () => {
    expect(businessMonth(new Date('2026-10-31T16:59:59Z'))).toBe('2026-10');
  });
  it('khoảng UTC của kỳ tháng', () => {
    const { start, end } = monthRangeUtc('2026-12');
    expect(start.toISOString()).toBe('2026-11-30T17:00:00.000Z');
    expect(end.toISOString()).toBe('2026-12-31T17:00:00.000Z');
  });
  it('từ chối kỳ không hợp lệ', () => {
    expect(() => monthRangeUtc('2026-13')).toThrow();
  });
});
