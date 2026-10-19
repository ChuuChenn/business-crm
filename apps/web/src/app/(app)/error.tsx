'use client';

import { Alert, AlertDescription, AlertTitle } from '@crm/ui/components/alert';
import { Button } from '@crm/ui/components/button';
import { TriangleAlert } from 'lucide-react';

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Đã xảy ra lỗi khi tải trang</AlertTitle>
        <AlertDescription>
          <p>Vui lòng thử lại. Nếu lỗi lặp lại, liên hệ quản trị hệ thống.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={reset}>
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
