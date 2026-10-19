import type { NextRequest } from 'next/server';

/**
 * Proxy cùng origin: trình duyệt gọi /api/*, máy chủ Next.js chuyển tiếp tới API nội bộ.
 * - Cookie phiên (Sprint 1) là first-party, không phải mở CORS cho trình duyệt.
 * - Địa chỉ API đọc từ API_INTERNAL_URL lúc chạy (không bị "đóng băng" lúc build như rewrites).
 * - Chỉ chuyển tiếp danh sách header cho phép. Ở production, reverse proxy (Caddy) định tuyến
 *   /api/* thẳng tới API; route này phục vụ môi trường dev và triển khai đơn giản.
 */
export const dynamic = 'force-dynamic';

const REQUEST_HEADERS = [
  'accept',
  'content-type',
  'cookie',
  'idempotency-key',
  'if-match',
  'x-request-id',
  'x-csrf-token',
  'user-agent',
];
const RESPONSE_HEADERS = [
  'content-type',
  'set-cookie',
  'x-request-id',
  'etag',
  'retry-after',
  'cache-control',
];

function apiBase(): string {
  return (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

async function forward(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  if (path.some((seg) => seg === '..' || seg.includes('\\'))) {
    return Response.json(
      { error: { code: 'BAD_REQUEST', message: 'Đường dẫn không hợp lệ' } },
      { status: 400 },
    );
  }
  const target = `${apiBase()}/api/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return Response.json(
      { error: { code: 'API_UNREACHABLE', message: 'Không kết nối được máy chủ API' } },
      { status: 502 },
    );
  }

  const resHeaders = new Headers();
  for (const name of RESPONSE_HEADERS) {
    if (name === 'set-cookie') {
      for (const cookie of upstream.headers.getSetCookie()) resHeaders.append('set-cookie', cookie);
      continue;
    }
    const value = upstream.headers.get(name);
    if (value !== null) resHeaders.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
