import type { PermissionKey } from '@crm/shared';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Coins,
  CreditCard,
  Gauge,
  HeartPulse,
  type LucideIcon,
  Package,
  ScrollText,
  Settings,
  ShoppingCart,
  Target,
  UserCog,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Sprint dự kiến triển khai; mục chưa triển khai hiển thị bị vô hiệu, không phải link giả. */
  sprint: number;
  implemented: boolean;
  /** Quyền cần có để thấy mục này (áp dụng từ Sprint 1 khi có đăng nhập). */
  permission?: PermissionKey;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [{ label: 'Bảng điều khiển', href: '/', icon: Gauge, sprint: 0, implemented: true }],
  },
  {
    title: 'Bán hàng',
    items: [
      {
        label: 'Khách hàng',
        href: '/customers',
        icon: Users,
        sprint: 2,
        implemented: false,
        permission: 'customer.read',
      },
      {
        label: 'Lead & Pipeline',
        href: '/leads',
        icon: Target,
        sprint: 2,
        implemented: false,
        permission: 'lead.read',
      },
      {
        label: 'Đơn hàng / POS',
        href: '/orders',
        icon: ShoppingCart,
        sprint: 4,
        implemented: false,
        permission: 'order.read',
      },
      {
        label: 'Thanh toán',
        href: '/payments',
        icon: CreditCard,
        sprint: 4,
        implemented: false,
        permission: 'payment.read',
      },
    ],
  },
  {
    title: 'Hàng hóa',
    items: [
      {
        label: 'Sản phẩm & Giá',
        href: '/products',
        icon: Package,
        sprint: 3,
        implemented: false,
        permission: 'product.read',
      },
      {
        label: 'Kho',
        href: '/inventory',
        icon: Boxes,
        sprint: 3,
        implemented: false,
        permission: 'inventory.read',
      },
    ],
  },
  {
    title: 'Nhân sự & Tài chính',
    items: [
      {
        label: 'Công việc',
        href: '/tasks',
        icon: ClipboardList,
        sprint: 2,
        implemented: false,
        permission: 'task.read',
      },
      {
        label: 'Nhân viên & KPI',
        href: '/employees',
        icon: UserCog,
        sprint: 2,
        implemented: false,
        permission: 'employee.read',
      },
      {
        label: 'Hoa hồng',
        href: '/commissions',
        icon: Coins,
        sprint: 5,
        implemented: false,
        permission: 'commission.read',
      },
      {
        label: 'Báo cáo',
        href: '/reports',
        icon: BarChart3,
        sprint: 5,
        implemented: false,
        permission: 'report.sales.read',
      },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      {
        label: 'Trạng thái hệ thống',
        href: '/system/status',
        icon: HeartPulse,
        sprint: 0,
        implemented: true,
      },
      {
        label: 'Nhật ký',
        href: '/audit',
        icon: ScrollText,
        sprint: 1,
        implemented: false,
        permission: 'audit.read',
      },
      {
        label: 'Phân quyền',
        href: '/settings/access',
        icon: Settings,
        sprint: 1,
        implemented: false,
        permission: 'role.read',
      },
    ],
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
