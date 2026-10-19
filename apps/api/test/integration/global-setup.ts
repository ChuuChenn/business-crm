import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { Client } from 'pg';

/**
 * Chuẩn bị database kiểm thử: xóa schema public của DB *_test rồi chạy toàn bộ migration.
 * Hàng rào an toàn: từ chối chạy nếu tên database không kết thúc bằng `_test`.
 */
export default async function setup(): Promise<void> {
  config({ path: resolve(__dirname, '../../../../.env'), quiet: true });
  const url = process.env['TEST_DATABASE_URL'];
  if (!url) throw new Error('Thiếu TEST_DATABASE_URL cho kiểm thử tích hợp');
  const dbName = new URL(url).pathname.replace(/^\//, '');
  if (!dbName.endsWith('_test')) {
    throw new Error(`Từ chối chạy test tích hợp trên database "${dbName}" (tên phải kết thúc bằng _test)`);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.end();

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });

  process.env['DATABASE_URL'] = url;
}
