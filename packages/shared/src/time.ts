/** Múi giờ nghiệp vụ duy nhất của hệ thống. DB lưu `timestamptz` (UTC). */
export const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const BUSINESS_LOCALE = 'vi-VN';

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Ngày nghiệp vụ (YYYY-MM-DD) theo giờ Việt Nam. */
export function businessDate(at: Date): string {
  return partsFormatter.format(at);
}

/** Kỳ tháng nghiệp vụ (YYYY-MM) theo giờ Việt Nam — dùng cho chốt kỳ hoa hồng. */
export function businessMonth(at: Date): string {
  return businessDate(at).slice(0, 7);
}

/**
 * Khoảng thời gian UTC [start, end) của một kỳ tháng theo giờ Việt Nam.
 * Việt Nam không có giờ mùa hè, offset cố định +07:00.
 */
export function monthRangeUtc(period: string): { start: Date; end: Date } {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(period);
  if (!m) throw new Error(`Kỳ không hợp lệ: ${period}`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const start = new Date(Date.UTC(year, month - 1, 1, -7, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, -7, 0, 0));
  return { start, end };
}

const dateTimeFormatter = new Intl.DateTimeFormat(BUSINESS_LOCALE, {
  timeZone: BUSINESS_TIMEZONE,
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatDateTimeVN(at: Date): string {
  return dateTimeFormatter.format(at);
}
