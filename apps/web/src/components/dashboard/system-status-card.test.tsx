import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SystemStatusCard } from './system-status-card';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const ready = (redis: 'up' | 'down', status: number) =>
  new Response(
    JSON.stringify({
      status: redis === 'up' ? 'ok' : 'degraded',
      timestamp: '2026-10-19T17:00:00.000Z',
      checks: {
        database: { status: 'up', latencyMs: 3 },
        redis:
          redis === 'up' ? { status: 'up', latencyMs: 1 } : { status: 'down', error: 'timeout' },
      },
    }),
    { status, headers: { 'content-type': 'application/json' } },
  );

afterEach(() => vi.unstubAllGlobals());

describe('SystemStatusCard', () => {
  it('hiển thị trạng thái hoạt động và giờ Việt Nam', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ready('up', 200)));
    render(<SystemStatusCard />, { wrapper });
    expect(await screen.findByTestId('dep-database')).toHaveTextContent('Hoạt động');
    expect(screen.getByTestId('dep-redis')).toHaveTextContent('Hoạt động');
    expect(screen.getByText(/00:00/)).toBeInTheDocument();
  });

  it('503 vẫn đọc được và hiển thị phụ thuộc bị mất kết nối', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ready('down', 503)));
    render(<SystemStatusCard />, { wrapper });
    expect(await screen.findByTestId('dep-redis')).toHaveTextContent('Mất kết nối');
  });

  it('hiển thị lỗi khi không gọi được API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad gateway', { status: 502 })));
    render(<SystemStatusCard />, { wrapper });
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      'Không kết nối được máy chủ API',
    );
  });
});
