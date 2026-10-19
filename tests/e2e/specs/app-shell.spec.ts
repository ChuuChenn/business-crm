import { expect, test } from '@playwright/test';

test.describe('Khung ứng dụng', () => {
  test('dashboard hiển thị trạng thái rỗng, không có số liệu giả', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Bảng điều khiển · Business CRM/);
    await expect(page.getByRole('heading', { level: 1, name: 'Bảng điều khiển' })).toBeVisible();
    const metrics = page.getByTestId('metric-placeholder');
    await expect(metrics).toHaveCount(6);
    for (const card of await metrics.all()) {
      await expect(card.getByLabel('Chưa có dữ liệu')).toHaveText('—');
    }
  });

  test('trạng thái hệ thống lấy dữ liệu thật từ API qua proxy Next.js', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dep-database')).toContainText('Hoạt động');
    await expect(page.getByTestId('dep-redis')).toContainText('Hoạt động');
  });

  test('API health trả JSON qua cùng origin', async ({ request }) => {
    const res = await request.get('/api/v1/health/ready');
    expect(res.status()).toBe(200);
    expect((await res.json()).checks.database.status).toBe('up');
  });

  test('chức năng chưa triển khai không phải link và trang không tồn tại trả 404', async ({
    page,
  }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
    if (await nav.isVisible()) {
      await expect(nav.locator('a[href="/customers"]')).toHaveCount(0);
      await expect(nav.getByText('Khách hàng').locator('..')).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    const res = await page.goto('/customers');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
  });

  test('chuyển giao diện sáng/tối', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole('button', { name: 'Chuyển sang giao diện tối' }).click();
    await expect(html).toHaveClass(/dark/);
  });

  test('không cuộn ngang ở mọi kích thước màn hình', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('metric-placeholder').first().waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('header bảo mật trên trang web', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-frame-options']).toBe('DENY');
    expect(res.headers()['x-powered-by']).toBeUndefined();
  });
});

test.describe('Điều hướng', () => {
  test('desktop: sidebar điều hướng tới trang trạng thái', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar cố định chỉ có trên màn hình lớn');
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Điều hướng chính' })
      .getByRole('link', { name: 'Trạng thái hệ thống' })
      .click();
    await expect(page).toHaveURL(/\/system\/status$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Trạng thái hệ thống' }),
    ).toBeVisible();
  });

  test('điện thoại: mở menu, điều hướng và menu tự đóng', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Menu trượt chỉ dùng trên điện thoại');
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeHidden();
    await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('link', { name: 'Trạng thái hệ thống' }).click();
    await expect(page).toHaveURL(/\/system\/status$/);
    await expect(dialog).toBeHidden();
  });
});
