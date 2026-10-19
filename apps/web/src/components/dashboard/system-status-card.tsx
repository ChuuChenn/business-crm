'use client';

import { Badge } from '@crm/ui/components/badge';
import { Button } from '@crm/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@crm/ui/components/card';
import { Skeleton } from '@crm/ui/components/skeleton';
import { formatDateTimeVN } from '@crm/shared';
import { Database, RefreshCw, Server } from 'lucide-react';
import { useReadiness } from '@/lib/queries';

const DEPENDENCIES = [
  { key: 'database', label: 'Cơ sở dữ liệu PostgreSQL', icon: Database },
  { key: 'redis', label: 'Redis (cache, hàng đợi)', icon: Server },
] as const;

export function SystemStatusCard() {
  const { data, isPending, isError, error, refetch, isFetching } = useReadiness();

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Trạng thái hệ thống</CardTitle>
          <CardDescription>Kiểm tra trực tiếp kết nối của máy chủ API.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
          Kiểm tra lại
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2" aria-label="Đang kiểm tra">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 p-3 text-sm text-destructive"
          >
            Không kết nối được máy chủ API. {error instanceof Error ? error.message : ''}
          </div>
        ) : (
          <div className="space-y-3">
            <ul className="divide-y rounded-md border">
              {DEPENDENCIES.map(({ key, label, icon: Icon }) => {
                const check = data.checks[key];
                const up = check.status === 'up';
                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm"
                    data-testid={`dep-${key}`}
                  >
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                    <span className="flex-1">{label}</span>
                    {up && check.latencyMs !== undefined ? (
                      <span className="text-xs text-muted-foreground">{check.latencyMs} ms</span>
                    ) : null}
                    <Badge variant={up ? 'success' : 'destructive'}>
                      {up ? 'Hoạt động' : 'Mất kết nối'}
                    </Badge>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">
              Cập nhật lúc {formatDateTimeVN(new Date(data.timestamp))} (giờ Việt Nam)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
