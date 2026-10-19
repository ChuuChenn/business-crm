import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Đọc .env ở gốc monorepo (môi trường dev). CI/production truyền biến môi trường trực tiếp.
config({ path: ['../../.env'], quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? '',
  },
});
