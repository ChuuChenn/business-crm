import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { PrismaClient } from '../../src/generated/prisma/client';

config({ path: resolve(__dirname, '../../../../.env'), quiet: true });

export function testDatabaseUrl(): string {
  const url = process.env['TEST_DATABASE_URL'];
  if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('TEST_DATABASE_URL không hợp lệ');
  return url;
}

/** Biến môi trường cho ứng dụng Nest trong test: luôn trỏ DB kiểm thử. */
export function useTestEnv(overrides: Record<string, string> = {}): void {
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = testDatabaseUrl();
  process.env['LOG_LEVEL'] = 'silent';
  Object.assign(process.env, overrides);
}

export function createTestPrisma(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl() }) });
}

/** Lấy thông điệp lỗi PostgreSQL thô (kể cả khi bị Prisma bọc). */
export async function pgError(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error('Mong đợi lỗi từ database nhưng câu lệnh thành công');
}
