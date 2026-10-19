import type { Metadata } from 'next';
import { SystemStatusCard } from '@/components/dashboard/system-status-card';

export const metadata: Metadata = { title: 'Trạng thái hệ thống' };

export default function SystemStatusPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trạng thái hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Kết nối giữa máy chủ ứng dụng và các dịch vụ hạ tầng. Tự động kiểm tra lại mỗi 30 giây.
        </p>
      </div>
      <SystemStatusCard />
    </div>
  );
}
