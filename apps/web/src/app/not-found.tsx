import { Button } from '@crm/ui/components/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold">Không tìm thấy trang</h1>
      <p className="max-w-md text-muted-foreground">
        Trang bạn tìm không tồn tại hoặc chức năng này chưa được triển khai.
      </p>
      <Button asChild>
        <Link href="/">Về bảng điều khiển</Link>
      </Button>
    </main>
  );
}
