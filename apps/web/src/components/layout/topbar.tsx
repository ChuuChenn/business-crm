'use client';

import { Button } from '@crm/ui/components/button';
import { Input } from '@crm/ui/components/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@crm/ui/components/sheet';
import { Bell, Menu, Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { ThemeToggle } from './theme-toggle';

export function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu điều hướng">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
          <SheetDescription className="sr-only">Các phân hệ của hệ thống</SheetDescription>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          disabled
          aria-label="Tìm kiếm toàn hệ thống (chưa triển khai)"
          placeholder="Tìm kiếm (Sprint 2)"
          className="pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          disabled
          aria-label="Thông báo (chưa triển khai, Sprint 1)"
          title="Thông báo — chưa triển khai (Sprint 1)"
        >
          <Bell />
        </Button>
        <span
          className="ml-1 hidden items-center gap-2 rounded-md border px-2 py-1 text-xs text-muted-foreground sm:flex"
          title="Đăng nhập sẽ có ở Sprint 1"
        >
          <UserRound className="size-4" aria-hidden />
          Chưa đăng nhập
        </span>
      </div>
    </header>
  );
}
