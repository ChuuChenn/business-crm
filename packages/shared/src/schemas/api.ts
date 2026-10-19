import { z } from 'zod';

/** Định dạng lỗi chuẩn của API (xem docs/api/API_CONVENTIONS.md). */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .string()
    .regex(/^-?[a-zA-Z][a-zA-Z0-9_]*$/)
    .optional(),
  q: z.string().trim().max(200).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}

/** Header bắt buộc cho thao tác tạo tiền/kho để chống tạo trùng. */
export const IDEMPOTENCY_HEADER = 'idempotency-key';
/** Header phiên bản cho optimistic locking (If-Match: <version>). */
export const VERSION_HEADER = 'if-match';
