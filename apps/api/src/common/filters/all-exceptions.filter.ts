import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiError } from '@crm/shared';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

const STATUS_CODES: Partial<Record<number, string>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'RATE_LIMITED',
  503: 'SERVICE_UNAVAILABLE',
};

interface Mapped {
  status: number;
  body: ApiError['error'];
}

/** Ánh xạ mọi lỗi về định dạng chuẩn; không bao giờ trả stack hoặc câu SQL cho client. */
export function mapException(exception: unknown): Mapped {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const res = exception.getResponse();
    const fromObject = typeof res === 'object' && res !== null ? (res as Record<string, unknown>) : {};
    const code = typeof fromObject['code'] === 'string' ? fromObject['code'] : (STATUS_CODES[status] ?? 'ERROR');
    const message =
      typeof res === 'string'
        ? res
        : typeof fromObject['message'] === 'string'
          ? fromObject['message']
          : exception.message;
    const details = fromObject['details'] ?? (Array.isArray(fromObject['message']) ? fromObject['message'] : undefined);
    return { status, body: { code, message, ...(details !== undefined ? { details } : {}) } };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if (exception.code === 'P2002') {
      return { status: HttpStatus.CONFLICT, body: { code: 'UNIQUE_VIOLATION', message: 'Dữ liệu đã tồn tại' } };
    }
    if (exception.code === 'P2025') {
      return { status: HttpStatus.NOT_FOUND, body: { code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' } };
    }
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống, vui lòng thử lại sau' },
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();
    const { status, body } = mapException(exception);

    if (status >= 500) {
      this.logger.error(
        { err: exception, requestId: req.id, path: req.path },
        'Unhandled exception',
      );
    }
    const payload: ApiError = { error: { ...body, ...(req.id ? { requestId: String(req.id) } : {}) } };
    res.status(status).json(payload);
  }
}
