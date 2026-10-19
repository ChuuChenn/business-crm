import { Inject, Injectable } from '@nestjs/common';
import type { Liveness, Readiness } from '@crm/shared';
import { APP_CONFIG, type AppConfig } from '../../config/env';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

type DependencyStatus = Readiness['checks']['database'];

const CHECK_TIMEOUT_MS = 2_000;

async function timed(check: () => Promise<unknown>): Promise<DependencyStatus> {
  const started = performance.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`timeout sau ${CHECK_TIMEOUT_MS}ms`)),
          CHECK_TIMEOUT_MS,
        );
      }),
    ]);
    return { status: 'up', latencyMs: Math.round(performance.now() - started) };
  } catch (err) {
    // Chỉ trả thông điệp ngắn, không trả connection string hay stack.
    const message = err instanceof Error ? err.message.split('\n')[0]!.slice(0, 200) : 'unknown';
    return { status: 'down', error: message };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  liveness(): Liveness {
    return {
      status: 'ok',
      service: 'business-crm-api',
      version: this.config.APP_VERSION,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async readiness(): Promise<Readiness> {
    const [database, redis] = await Promise.all([
      timed(() => this.prisma.$queryRaw`SELECT 1`),
      timed(() => this.redis.ping()),
    ]);
    return {
      status: database.status === 'up' && redis.status === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: { database, redis },
    };
  }
}
