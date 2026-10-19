import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'DATABASE_URL phải là URL PostgreSQL'),
    REDIS_URL: z.string().regex(/^rediss?:\/\//, 'REDIS_URL phải là URL Redis'),
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((s) =>
        s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    /** Số proxy tin cậy phía trước API (Caddy = 1) để lấy đúng IP client cho rate limit/log. */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    OPENAPI_ENABLED: booleanString.optional(),
    APP_VERSION: z.string().default('0.1.0'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    for (const key of ['DATABASE_URL', 'REDIS_URL'] as const) {
      if (/change-me|_dev_password|crm_dev_redis/.test(env[key])) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} đang dùng mật khẩu mẫu/dev — không được chạy production`,
        });
      }
    }
  });

export type AppConfig = z.infer<typeof envSchema>;

export class InvalidConfigError extends Error {
  constructor(issues: string[]) {
    super(`Cấu hình môi trường không hợp lệ:\n- ${issues.join('\n- ')}`);
    this.name = 'InvalidConfigError';
  }
}

/** Đọc và kiểm tra biến môi trường. Không bao giờ in giá trị (có thể chứa secret). */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new InvalidConfigError(
      parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    );
  }
  return parsed.data;
}

export const APP_CONFIG = Symbol('APP_CONFIG');
