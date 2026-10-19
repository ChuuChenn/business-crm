import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { REDACT_PATHS } from '../../src/common/http/logger';

describe('log redaction', () => {
  it('không ghi mật khẩu, token, cookie, bí mật MFA vào log', () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk: Buffer, _enc, cb) {
        lines.push(chunk.toString());
        cb();
      },
    });
    const logger = pino({ redact: { paths: REDACT_PATHS, censor: '[REDACTED]' } }, sink);
    logger.info({
      req: { headers: { authorization: 'Bearer abc.def', cookie: 'sid=s3cr3t' } },
      body: { password: 'P@ssw0rd!', token: 'reset-token-xyz', mfaSecret: 'JBSWY3DP', email: 'a@b.vn' },
    });
    const out = lines.join('');
    for (const secret of ['abc.def', 's3cr3t', 'P@ssw0rd!', 'reset-token-xyz', 'JBSWY3DP']) {
      expect(out).not.toContain(secret);
    }
    expect(out).toContain('a@b.vn');
    expect(out).toContain('[REDACTED]');
  });
});
