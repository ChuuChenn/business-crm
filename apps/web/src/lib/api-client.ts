import { apiErrorSchema } from '@crm/shared';
import type { z } from 'zod';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Gọi API cùng origin (/api/* được Next.js chuyển tiếp tới backend) và kiểm tra dữ liệu bằng Zod.
 * `acceptStatuses` cho phép đọc body của mã lỗi có ý nghĩa nghiệp vụ (ví dụ 503 của readiness).
 */
export async function apiGet<T extends z.ZodType>(
  path: string,
  schema: T,
  {
    acceptStatuses = [] as number[],
    signal,
  }: { acceptStatuses?: number[]; signal?: AbortSignal } = {},
): Promise<z.infer<T>> {
  const res = await fetch(path, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
    signal,
  });
  let body: unknown = undefined;
  try {
    body = await res.json();
  } catch {
    // body không phải JSON
  }
  if (!res.ok && !acceptStatuses.includes(res.status)) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiRequestError(
      res.status,
      parsed.success ? parsed.data.error.code : 'HTTP_ERROR',
      parsed.success ? parsed.data.error.message : `Yêu cầu thất bại (HTTP ${res.status})`,
      body,
    );
  }
  return schema.parse(body);
}
