import { describe, expect, it } from 'vitest';
import {
  MoneyError,
  applyBps,
  commissionFromGrossProfit,
  divRound,
  formatVnd,
  grossProfit,
  netFromGross,
  splitByBps,
  toVnd,
} from './money';

describe('toVnd', () => {
  it('chấp nhận số nguyên dạng chuỗi, number, bigint', () => {
    expect(toVnd('1500000')).toBe(1_500_000n);
    expect(toVnd(' -20 ')).toBe(-20n);
    expect(toVnd(42)).toBe(42n);
    expect(toVnd(7n)).toBe(7n);
  });
  it('từ chối số lẻ và số không an toàn', () => {
    expect(() => toVnd('10.5')).toThrow(MoneyError);
    expect(() => toVnd(10.5)).toThrow(MoneyError);
    expect(() => toVnd(Number.MAX_SAFE_INTEGER + 1)).toThrow(MoneyError);
    expect(() => toVnd('1e6')).toThrow(MoneyError);
  });
  it('giữ chính xác số rất lớn', () => {
    expect(toVnd('9223372036854775807')).toBe(9223372036854775807n);
  });
});

describe('divRound', () => {
  it.each([
    [5n, 2n, 'HALF_UP', 3n],
    [-5n, 2n, 'HALF_UP', -3n],
    [4n, 3n, 'HALF_UP', 1n],
    [5n, 2n, 'FLOOR', 2n],
    [-5n, 2n, 'FLOOR', -3n],
    [5n, 2n, 'CEIL', 3n],
    [-5n, 2n, 'CEIL', -2n],
    [6n, 3n, 'HALF_UP', 2n],
  ] as const)('%s / %s (%s) = %s', (n, d, mode, expected) => {
    expect(divRound(n, d, mode)).toBe(expected);
  });
  it('chia cho 0 báo lỗi', () => {
    expect(() => divRound(1n, 0n, 'FLOOR')).toThrow(MoneyError);
  });
});

describe('applyBps / netFromGross', () => {
  it('VAT 10% trên 1.000.000', () => {
    expect(applyBps(1_000_000n, 1000, 'HALF_UP')).toBe(100_000n);
  });
  it('tách giá chưa VAT từ giá đã gồm VAT 10%', () => {
    expect(netFromGross(1_100_000n, 1000, 'HALF_UP')).toBe(1_000_000n);
    expect(netFromGross(999_999n, 800, 'HALF_UP')).toBe(925_925n);
  });
  it('từ chối tỷ lệ lẻ hoặc vượt 100%', () => {
    expect(() => applyBps(100n, 10.5, 'FLOOR')).toThrow(MoneyError);
    expect(() => applyBps(100n, 10_001, 'FLOOR')).toThrow(MoneyError);
    expect(() => applyBps(100n, -1, 'FLOOR')).toThrow(MoneyError);
  });
});

describe('QUY TẮC ĐÃ KHÓA: hoa hồng theo lợi nhuận gộp', () => {
  it('lợi nhuận gộp = doanh thu thuần chưa VAT − giá vốn', () => {
    expect(grossProfit(10_000_000n, 7_500_000n)).toBe(2_500_000n);
  });
  it('hoa hồng = max(0, LNG) × tỷ lệ', () => {
    expect(commissionFromGrossProfit(2_500_000n, 1000, 'FLOOR')).toBe(250_000n);
  });
  it('lợi nhuận gộp âm → hoa hồng 0', () => {
    expect(commissionFromGrossProfit(-500_000n, 1000, 'FLOOR')).toBe(0n);
  });
  it('làm tròn theo chế độ được truyền vào', () => {
    expect(commissionFromGrossProfit(333_333n, 150, 'FLOOR')).toBe(4_999n);
    expect(commissionFromGrossProfit(333_333n, 150, 'HALF_UP')).toBe(5_000n);
  });
});

describe('splitByBps', () => {
  it('tổng các phần luôn bằng số gốc', () => {
    const parts = splitByBps(100_001n, [3334, 3333, 3333]);
    expect(parts.reduce((a, b) => a + b, 0n)).toBe(100_001n);
    expect(parts).toEqual([33_341n, 33_330n, 33_330n]);
  });
  it('tổng tỷ lệ khác 100% bị từ chối', () => {
    expect(() => splitByBps(100n, [5000, 4000])).toThrow(MoneyError);
  });
});

describe('formatVnd', () => {
  it('định dạng tiếng Việt', () => {
    expect(formatVnd(1_234_000n).replace(/\s/g, ' ')).toBe('1.234.000 ₫');
  });
});
