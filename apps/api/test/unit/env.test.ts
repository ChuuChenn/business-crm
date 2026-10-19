import { describe, expect, it } from 'vitest';
import { InvalidConfigError, loadConfig } from '../../src/config/env';

const base = {
  DATABASE_URL: 'postgresql://u:secretpw@db:5432/crm',
  REDIS_URL: 'redis://:pw@redis:6379/0',
};

describe('loadConfig', () => {
  it('áp dụng giá trị mặc định', () => {
    const c = loadConfig({ ...base });
    expect(c.PORT).toBe(4000);
    expect(c.NODE_ENV).toBe('development');
    expect(c.CORS_ORIGINS).toEqual([]);
  });

  it('tách danh sách CORS', () => {
    expect(
      loadConfig({ ...base, CORS_ORIGINS: 'https://a.vn, https://b.vn' }).CORS_ORIGINS,
    ).toEqual(['https://a.vn', 'https://b.vn']);
  });

  it('báo lỗi khi thiếu DATABASE_URL và không lộ giá trị secret', () => {
    try {
      loadConfig({ REDIS_URL: 'redis://:topsecret@r:6379' });
      expect.fail('phải ném lỗi');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidConfigError);
      expect((e as Error).message).toContain('DATABASE_URL');
      expect((e as Error).message).not.toContain('topsecret');
    }
  });

  it('chặn production dùng mật khẩu mẫu', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://crm:change-me-postgres@db/crm',
        REDIS_URL: base.REDIS_URL,
      }),
    ).toThrow(/mật khẩu mẫu/);
    expect(() => loadConfig({ NODE_ENV: 'production', ...base })).not.toThrow();
  });
});
