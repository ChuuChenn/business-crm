import { Alert, AlertDescription, AlertTitle } from '@crm/ui/components/alert';
import { Banknote, Boxes, Info, ReceiptText, TrendingUp, Users, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import { MetricPlaceholder } from '@/components/dashboard/metric-placeholder';
import { SystemStatusCard } from '@/components/dashboard/system-status-card';

export const metadata: Metadata = { title: 'Bảng điều khiển' };

const METRICS = [
  {
    title: 'Doanh thu thuần',
    icon: Banknote,
    sprint: 5,
    description: 'Doanh thu chưa VAT sau chiết khấu, trả hàng.',
  },
  {
    title: 'Lợi nhuận gộp',
    icon: TrendingUp,
    sprint: 5,
    description: 'Doanh thu thuần trừ giá vốn tương ứng.',
  },
  { title: 'Đơn hàng', icon: ReceiptText, sprint: 4, description: 'Số đơn đã xác nhận trong kỳ.' },
  { title: 'Công nợ phải thu', icon: Wallet, sprint: 4, description: 'Tổng tiền khách còn nợ.' },
  {
    title: 'Giá trị tồn kho',
    icon: Boxes,
    sprint: 3,
    description: 'Theo giá vốn của hàng sẵn bán.',
  },
  {
    title: 'Khách hàng quay lại',
    icon: Users,
    sprint: 5,
    description: 'Tỷ lệ khách mua từ lần thứ hai.',
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bảng điều khiển</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan hoạt động kinh doanh của cửa hàng.
        </p>
      </div>

      <Alert>
        <Info />
        <AlertTitle>Hệ thống đang ở giai đoạn nền tảng (Sprint 0)</AlertTitle>
        <AlertDescription>
          Chưa có dữ liệu nghiệp vụ. Các chỉ số dưới đây sẽ hiển thị số liệu thật, truy ngược được
          về giao dịch nguồn, khi các phân hệ tương ứng hoàn thành.
        </AlertDescription>
      </Alert>

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Chỉ số kinh doanh
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {METRICS.map((m) => (
            <MetricPlaceholder key={m.title} {...m} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <SystemStatusCard />
      </div>
    </div>
  );
}
