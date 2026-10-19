import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@crm/ui/components/card';
import type { LucideIcon } from 'lucide-react';

/**
 * Ô chỉ số ở trạng thái rỗng. Không hiển thị số giả: chỉ số thật sẽ truy ngược về giao dịch
 * nguồn khi module tương ứng được triển khai.
 */
export function MetricPlaceholder({
  title,
  icon: Icon,
  sprint,
  description,
}: {
  title: string;
  icon: LucideIcon;
  sprint: number;
  description: string;
}) {
  return (
    <Card data-testid="metric-placeholder">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-muted-foreground/60" aria-label="Chưa có dữ liệu">
          —
        </p>
        <CardDescription className="mt-1">
          {description} Có dữ liệu từ Sprint {sprint}.
        </CardDescription>
      </CardContent>
    </Card>
  );
}
