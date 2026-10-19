/**
 * Tiền tệ VND.
 *
 * Quy ước toàn hệ thống:
 * - Tiền luôn là số nguyên đồng (VND không có đơn vị lẻ), kiểu `bigint` trong TypeScript và
 *   `BIGINT` trong PostgreSQL. Không bao giờ dùng floating-point cho tiền.
 * - Tỷ lệ (thuế suất, tỷ lệ hoa hồng, chiết khấu %) là số nguyên basis point (bps):
 *   1% = 100 bps, 100% = 10_000 bps. Ví dụ VAT 10% = 1000 bps, hoa hồng 1,5% = 150 bps.
 * - Mọi phép tính có làm tròn phải truyền chế độ làm tròn tường minh; không có giá trị mặc định
 *   vì quy tắc làm tròn là quyết định nghiệp vụ (xem docs/business-rules/OPEN_DECISIONS.md).
 */

export type Vnd = bigint;
export type Bps = number;

export const BPS_DENOMINATOR = 10_000n;
export const MAX_BPS = 10_000;

export type RoundingMode = 'HALF_UP' | 'FLOOR' | 'CEIL';

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/** Chuyển giá trị đầu vào (chuỗi số nguyên, số nguyên an toàn, bigint) thành VND. */
export function toVnd(input: string | number | bigint): Vnd {
  if (typeof input === 'bigint') return input;
  if (typeof input === 'number') {
    if (!Number.isSafeInteger(input)) {
      throw new MoneyError(`Số tiền phải là số nguyên an toàn, nhận được: ${input}`);
    }
    return BigInt(input);
  }
  const trimmed = input.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new MoneyError(`Số tiền không hợp lệ (chỉ chấp nhận số nguyên đồng): "${input}"`);
  }
  return BigInt(trimmed);
}

export function assertBps(bps: Bps, { allowNegative = false } = {}): void {
  if (!Number.isInteger(bps)) throw new MoneyError(`Tỷ lệ bps phải là số nguyên: ${bps}`);
  if (bps > MAX_BPS) throw new MoneyError(`Tỷ lệ vượt quá 100%: ${bps} bps`);
  if (!allowNegative && bps < 0) throw new MoneyError(`Tỷ lệ không được âm: ${bps} bps`);
}

/** Chia số nguyên với chế độ làm tròn tường minh (hỗ trợ số âm). */
export function divRound(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint {
  if (denominator === 0n) throw new MoneyError('Chia cho 0');
  if (denominator < 0n) return divRound(-numerator, -denominator, mode);
  const q = numerator / denominator; // làm tròn về 0
  const r = numerator % denominator;
  if (r === 0n) return q;
  switch (mode) {
    case 'FLOOR':
      return numerator < 0n ? q - 1n : q;
    case 'CEIL':
      return numerator > 0n ? q + 1n : q;
    case 'HALF_UP': {
      // Làm tròn nửa xa 0 (0,5 → 1; -0,5 → -1).
      const twiceAbsR = (r < 0n ? -r : r) * 2n;
      if (twiceAbsR >= denominator) return numerator < 0n ? q - 1n : q + 1n;
      return q;
    }
  }
}

/** amount × bps / 10000 */
export function applyBps(amount: Vnd, bps: Bps, mode: RoundingMode): Vnd {
  assertBps(bps);
  return divRound(amount * BigInt(bps), BPS_DENOMINATOR, mode);
}

/** Tách giá chưa VAT từ giá đã gồm VAT: net = gross × 10000 / (10000 + vatBps). */
export function netFromGross(grossInclVat: Vnd, vatBps: Bps, mode: RoundingMode): Vnd {
  assertBps(vatBps);
  return divRound(grossInclVat * BPS_DENOMINATOR, BPS_DENOMINATOR + BigInt(vatBps), mode);
}

/**
 * QUY TẮC ĐÃ KHÓA — Lợi nhuận gộp = Doanh thu thuần chưa VAT − Giá vốn tương ứng.
 */
export function grossProfit(netRevenueExclVat: Vnd, costOfGoods: Vnd): Vnd {
  return netRevenueExclVat - costOfGoods;
}

/**
 * QUY TẮC ĐÃ KHÓA — Hoa hồng = MAX(0, Lợi nhuận gộp đủ điều kiện) × Tỷ lệ hoa hồng.
 */
export function commissionFromGrossProfit(
  eligibleGrossProfit: Vnd,
  rateBps: Bps,
  mode: RoundingMode,
): Vnd {
  const base = eligibleGrossProfit > 0n ? eligibleGrossProfit : 0n;
  return applyBps(base, rateBps, mode);
}

/**
 * Chia một khoản tiền theo các phần tỷ lệ (bps, tổng = 10000) sao cho tổng các phần
 * bằng đúng số gốc (phần dư do làm tròn dồn vào phần đầu tiên có tỷ lệ lớn nhất).
 * Dùng cho chia hoa hồng nhiều nhân viên.
 */
export function splitByBps(amount: Vnd, sharesBps: readonly Bps[]): Vnd[] {
  if (sharesBps.length === 0) throw new MoneyError('Cần ít nhất một phần chia');
  sharesBps.forEach((s) => assertBps(s));
  const total = sharesBps.reduce((a, b) => a + b, 0);
  if (total !== MAX_BPS) throw new MoneyError(`Tổng tỷ lệ chia phải bằng 10000 bps, nhận ${total}`);
  const parts = sharesBps.map((s) => divRound(amount * BigInt(s), BPS_DENOMINATOR, 'FLOOR'));
  const remainder = amount - parts.reduce((a, b) => a + b, 0n);
  let maxIdx = 0;
  sharesBps.forEach((s, i) => {
    if (s > (sharesBps[maxIdx] ?? 0)) maxIdx = i;
  });
  parts[maxIdx] = (parts[maxIdx] ?? 0n) + remainder;
  return parts;
}

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatVnd(amount: Vnd): string {
  return vndFormatter.format(amount);
}

/** Tiền đi qua JSON dưới dạng chuỗi số nguyên để không mất chính xác. */
export function vndToJson(amount: Vnd): string {
  return amount.toString();
}
