import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Params } from 'nestjs-pino';
import type { AppConfig } from '../../config/env';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{8,100}$/;

/**
 * Các đường dẫn bị che trong log. Không bao giờ ghi mật khẩu, token, cookie, bí mật MFA.
 * Kiểm thử: test/unit/logger.test.ts
 */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-csrf-token"]',
  'res.headers["set-cookie"]',
  '*.password',
  '*.newPassword',
  '*.currentPassword',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.mfaSecret',
  '*.mfaSecretEnc',
  '*.otp',
];

export function loggerParams(config: AppConfig): Params {
  return {
    pinoHttp: {
      level: config.LOG_LEVEL,
      redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
      genReqId: (req: IncomingMessage, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && REQUEST_ID_RE.test(incoming) ? incoming : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      customProps: () => ({ service: 'api' }),
      autoLogging: { ignore: (req) => (req.url ?? '').startsWith('/api/v1/health') },
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          // Bỏ query string: có thể chứa token đặt lại mật khẩu.
          url: req.url?.split('?')[0],
        }),
      },
      ...(config.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
        : {}),
    },
  };
}
