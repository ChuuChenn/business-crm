import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { APP_CONFIG, type AppConfig } from '../../config/env';

/**
 * Kết nối Redis dùng chung (cache, rate limit phân tán, hàng đợi BullMQ ở các sprint sau).
 * Không xếp hàng lệnh khi mất kết nối để health check phản ánh đúng thực trạng.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 2_000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 500, 5_000),
    });
    this.client.on('error', (err: Error) => {
      // Không log URL (chứa mật khẩu).
      this.logger.warn(`Redis lỗi kết nối: ${err.message}`);
    });
  }

  /** Kết nối khi khởi động; nếu Redis chưa sẵn sàng, ioredis tự thử lại theo retryStrategy. */
  async onModuleInit(): Promise<void> {
    await this.client.connect().catch((err: Error) => {
      this.logger.warn(`Chưa kết nối được Redis lúc khởi động: ${err.message}`);
    });
  }

  async ping(): Promise<void> {
    const res = await this.client.ping();
    if (res !== 'PONG') throw new Error(`Phản hồi Redis không hợp lệ: ${res}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}
