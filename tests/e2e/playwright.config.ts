import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

/**
 * E2E chạy trên bản build production của web và API, nối PostgreSQL + Redis thật.
 * Điều kiện: đã `pnpm build` và hạ tầng đang chạy (`pnpm infra:up`, `pnpm db:migrate`).
 */
const root = resolve(__dirname, '../..');
config({ path: resolve(root, '.env'), quiet: true });

const WEB_PORT = Number(process.env['E2E_WEB_PORT'] ?? 3100);
const API_PORT = Number(process.env['E2E_API_PORT'] ?? 4100);
const executablePath = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'];

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node dist/main.js',
      cwd: resolve(root, 'apps/api'),
      url: `http://localhost:${API_PORT}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'test',
        PORT: String(API_PORT),
        LOG_LEVEL: 'warn',
        DATABASE_URL: process.env['DATABASE_URL'] ?? '',
        REDIS_URL: process.env['REDIS_URL'] ?? '',
      },
    },
    {
      command: `pnpm exec next start --port ${WEB_PORT}`,
      cwd: resolve(root, 'apps/web'),
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { API_INTERNAL_URL: `http://localhost:${API_PORT}` },
    },
  ],
});
