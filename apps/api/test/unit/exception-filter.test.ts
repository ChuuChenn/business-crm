import { BadRequestException, ConflictException, ForbiddenException, HttpException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { mapException } from '../../src/common/filters/all-exceptions.filter';
import { Prisma } from '../../src/generated/prisma/client';

describe('mapException', () => {
  it('giữ mã lỗi nghiệp vụ tùy chỉnh', () => {
    const r = mapException(new ConflictException({ code: 'VERSION_CONFLICT', message: 'Đơn đã bị sửa' }));
    expect(r).toEqual({ status: 409, body: { code: 'VERSION_CONFLICT', message: 'Đơn đã bị sửa' } });
  });

  it('dùng mã mặc định theo HTTP status', () => {
    expect(mapException(new ForbiddenException()).body.code).toBe('FORBIDDEN');
    expect(mapException(new HttpException('x', 429)).body.code).toBe('RATE_LIMITED');
  });

  it('đưa danh sách lỗi validate vào details', () => {
    const r = mapException(new BadRequestException(['email không hợp lệ']));
    expect(r.status).toBe(400);
    expect(r.body.details).toEqual(['email không hợp lệ']);
  });

  it('ánh xạ lỗi unique của Prisma thành 409', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    expect(mapException(err)).toEqual({ status: 409, body: { code: 'UNIQUE_VIOLATION', message: 'Dữ liệu đã tồn tại' } });
  });

  it('lỗi không xác định → 500 và không lộ thông điệp nội bộ', () => {
    const r = mapException(new Error('connect ECONNREFUSED postgresql://crm:secret@db'));
    expect(r.status).toBe(500);
    expect(JSON.stringify(r.body)).not.toContain('secret');
  });
});
