import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Kiểm thử tích hợp chạy trên PostgreSQL + Redis THẬT (không mock).
 * Yêu cầu TEST_DATABASE_URL trỏ tới database có tên kết thúc bằng `_test`.
 */
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/integration/**/*.int.test.ts'],
    environment: 'node',
    globalSetup: ['test/integration/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
