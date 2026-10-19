import type { INestApplication } from '@nestjs/common';
import { livenessSchema, readinessSchema } from '@crm/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.factory';
import { useTestEnv } from './helpers';

describe('Health API (PostgreSQL + Redis thật)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    useTestEnv();
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/health → 200, đúng schema', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(livenessSchema.parse(res.body).service).toBe('business-crm-api');
  });

  it('GET /api/v1/health/ready → 200 khi DB và Redis hoạt động', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    const body = readinessSchema.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.checks.database.status).toBe('up');
    expect(body.checks.redis.status).toBe('up');
  });

  it('trả x-request-id; giữ id hợp lệ client gửi, thay id không hợp lệ', async () => {
    const own = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'req-12345678');
    expect(own.headers['x-request-id']).toBe('req-12345678');
    const bad = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', '<script>');
    expect(bad.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('header bảo mật (helmet), không lộ x-powered-by', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('route không tồn tại → 404 định dạng lỗi chuẩn', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/khong-ton-tai').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(typeof res.body.error.requestId).toBe('string');
  });

  it('CORS chỉ cho phép origin trong danh sách', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('xuất OpenAPI 3.1 có endpoint health', async () => {
    const res = await request(app.getHttpServer()).get('/api/openapi.json').expect(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(['/api/v1/health', '/api/v1/health/ready']),
    );
  });
});

describe('Health API khi Redis không hoạt động', () => {
  let app: INestApplication;

  beforeAll(async () => {
    useTestEnv({ REDIS_URL: 'redis://127.0.0.1:1/0' });
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    delete process.env['REDIS_URL'];
  });

  it('GET /api/v1/health/ready → 503 degraded, không lộ chi tiết kết nối', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(503);
    const body = readinessSchema.parse(res.body);
    expect(body.status).toBe('degraded');
    expect(body.checks.database.status).toBe('up');
    expect(body.checks.redis.status).toBe('down');
  });

  it('liveness vẫn 200', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });
});
