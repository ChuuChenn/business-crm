import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NAV_SECTIONS, isActivePath } from '@/config/navigation';
import { Sidebar } from './sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/system/status' }));

describe('Sidebar', () => {
  it('chỉ mục đã triển khai mới là link thật', () => {
    render(<Sidebar />);
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    const links = within(nav)
      .getAllByRole('link')
      .filter((el) => el.tagName === 'A');
    const implemented = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => i.implemented);
    expect(links.map((a) => a.getAttribute('href')).sort()).toEqual(
      implemented.map((i) => i.href).sort(),
    );
  });

  it('mục chưa triển khai bị vô hiệu và ghi rõ sprint dự kiến', () => {
    render(<Sidebar />);
    const customers = screen.getByText('Khách hàng').closest('[aria-disabled]');
    expect(customers).toHaveAttribute('aria-disabled', 'true');
    expect(customers).toHaveTextContent('Sprint 2');
    expect(customers?.tagName).not.toBe('A');
  });

  it('đánh dấu trang hiện tại', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: /Trạng thái hệ thống/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /Bảng điều khiển/ })).not.toHaveAttribute(
      'aria-current',
    );
  });
});

describe('isActivePath', () => {
  it('trang chủ chỉ khớp chính xác', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/customers', '/')).toBe(false);
    expect(isActivePath('/system/status', '/system')).toBe(true);
    expect(isActivePath('/systems', '/system')).toBe(false);
  });
});
