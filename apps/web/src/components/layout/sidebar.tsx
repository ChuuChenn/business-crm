'use client';

import { Badge } from '@crm/ui/components/badge';
import { cn } from '@crm/ui/lib/utils';
import { Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_SECTIONS, isActivePath, type NavItem } from '@/config/navigation';

function NavEntry({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const base = 'flex items-center gap-3 rounded-md px-3 py-2 text-sm';

  if (!item.implemented) {
    return (
      <span
        role="link"
        aria-disabled="true"
        title={`Chưa triển khai — dự kiến Sprint ${item.sprint}`}
        className={cn(base, 'cursor-not-allowed text-sidebar-foreground/50')}
      >
        <Icon className="size-4" aria-hidden />
        <span className="flex-1 truncate">{item.label}</span>
        <Badge variant="outline" className="text-[10px]">
          Sprint {item.sprint}
        </Badge>
      </span>
    );
  }

  const active = isActivePath(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        base,
        'font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground',
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/';
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Store className="size-4" aria-hidden />
        </span>
        <span className="font-semibold">Business CRM</span>
      </div>
      <nav aria-label="Điều hướng chính" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavEntry item={item} pathname={pathname} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p className="border-t border-sidebar-border px-5 py-3 text-xs text-muted-foreground">
        Phiên bản 0.1.0 · Sprint 0
      </p>
    </div>
  );
}
