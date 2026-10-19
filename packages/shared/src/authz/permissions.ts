/**
 * Phạm vi dữ liệu của một quyền. Backend dùng phạm vi để lọc truy vấn (chống IDOR):
 * - OWN: bản ghi được giao cho / do chính nhân viên tạo.
 * - TEAM: bản ghi của các thành viên trong nhóm mình quản lý.
 * - STORE: toàn bộ bản ghi thuộc cửa hàng của nhân viên.
 * - ORG: toàn bộ tổ chức (mọi cửa hàng).
 */
export const SCOPES = ['OWN', 'TEAM', 'STORE', 'ORG'] as const;
export type Scope = (typeof SCOPES)[number];
export const SCOPE_RANK: Record<Scope, number> = { OWN: 1, TEAM: 2, STORE: 3, ORG: 4 };

export interface PermissionDef {
  key: string;
  module: string;
  label: string;
  /** Quyền có phân biệt phạm vi dữ liệu hay không. */
  scoped: boolean;
  /**
   * QUY TẮC ĐÃ KHÓA: chỉ vai trò Giám đốc được nắm quyền này. Hệ thống phải từ chối
   * gán quyền này cho vai trò khác, kể cả khi Super Admin chỉnh ma trận quyền.
   */
  directorOnly?: boolean;
  /** Quyền nhạy cảm: thao tác bắt buộc ghi audit log và nên yêu cầu MFA gần đây. */
  sensitive?: boolean;
}

const p = (
  key: string,
  module: string,
  label: string,
  opts: Partial<Pick<PermissionDef, 'scoped' | 'directorOnly' | 'sensitive'>> = {},
): PermissionDef => ({ key, module, label, scoped: opts.scoped ?? false, ...opts });

export const PERMISSIONS = [
  // Hệ thống & phân quyền
  p('system.settings.manage', 'system', 'Cấu hình hệ thống', { sensitive: true }),
  p('user.read', 'system', 'Xem tài khoản nhân viên'),
  p('user.manage', 'system', 'Tạo/sửa tài khoản nhân viên', { sensitive: true }),
  p('user.lock', 'system', 'Khóa/mở khóa tài khoản', { sensitive: true }),
  p('user.session.revoke', 'system', 'Thu hồi phiên đăng nhập', { sensitive: true }),
  p('role.read', 'system', 'Xem vai trò và ma trận quyền'),
  p('role.manage', 'system', 'Gán quyền cho vai trò, gán vai trò cho nhân viên', { sensitive: true }),
  p('audit.read', 'system', 'Xem nhật ký hành động và nhật ký truy cập', { scoped: true }),

  // Khách hàng
  p('customer.read', 'customer', 'Xem khách hàng', { scoped: true }),
  p('customer.create', 'customer', 'Tạo khách hàng'),
  p('customer.update', 'customer', 'Sửa khách hàng', { scoped: true }),
  p('customer.assign', 'customer', 'Phân công / chuyển giao khách hàng', { scoped: true }),
  p('customer.merge', 'customer', 'Gộp khách hàng trùng', { scoped: true, sensitive: true }),
  p('customer.import', 'customer', 'Nhập khách hàng từ Excel', { sensitive: true }),
  p('customer.export', 'customer', 'Xuất khách hàng ra Excel', { scoped: true, sensitive: true }),
  p('customer.consent.update', 'customer', 'Cập nhật đồng ý liên hệ tiếp thị', { scoped: true }),
  p('care.log', 'customer', 'Ghi lịch sử chăm sóc', { scoped: true }),

  // Lead & pipeline
  p('lead.read', 'lead', 'Xem lead', { scoped: true }),
  p('lead.create', 'lead', 'Tạo lead'),
  p('lead.update', 'lead', 'Cập nhật lead và chuyển trạng thái', { scoped: true }),
  p('lead.assign', 'lead', 'Phân công lead', { scoped: true }),
  p('lead.reopen', 'lead', 'Mở lại lead đã đóng', { scoped: true }),

  // Công việc & nhân sự
  p('task.read', 'task', 'Xem công việc', { scoped: true }),
  p('task.create', 'task', 'Tạo và giao việc', { scoped: true }),
  p('task.update', 'task', 'Cập nhật trạng thái công việc', { scoped: true }),
  p('task.handover', 'task', 'Bàn giao công việc', { scoped: true }),
  p('schedule.read', 'task', 'Xem lịch làm việc', { scoped: true }),
  p('schedule.manage', 'task', 'Xếp lịch làm việc', { scoped: true }),
  p('employee.read', 'employee', 'Xem hồ sơ nhân viên', { scoped: true }),
  p('employee.manage', 'employee', 'Quản lý hồ sơ nhân viên, nhóm', { sensitive: true }),
  p('kpi.read', 'employee', 'Xem KPI', { scoped: true }),
  p('kpi.manage', 'employee', 'Đặt chỉ tiêu KPI', { scoped: true }),
  p('performance.review', 'employee', 'Đánh giá hiệu suất', { scoped: true }),

  // Sản phẩm & giá
  p('product.read', 'product', 'Xem sản phẩm và giá bán'),
  p('product.manage', 'product', 'Tạo/sửa sản phẩm, danh mục, biến thể'),
  p('product.cost.read', 'product', 'Xem giá vốn', { sensitive: true }),
  p('product.price.manage', 'product', 'Đặt giá bán đề xuất, giá sàn, thuế suất', { sensitive: true }),
  p('price_exception.request', 'product', 'Tạo yêu cầu bán dưới giá sàn', { scoped: true }),
  p('price_exception.approve', 'product', 'Phê duyệt/từ chối bán dưới giá sàn', {
    directorOnly: true,
    sensitive: true,
  }),

  // Kho
  p('inventory.read', 'inventory', 'Xem tồn kho và lịch sử biến động'),
  p('inventory.document.create', 'inventory', 'Lập chứng từ kho nháp'),
  p('inventory.document.approve', 'inventory', 'Duyệt chứng từ kho', { sensitive: true }),
  p('inventory.document.post', 'inventory', 'Ghi sổ chứng từ kho đã duyệt (xuất/nhập thực tế)'),
  p('inventory.stocktake.count', 'inventory', 'Thực hiện kiểm kê'),
  p('inventory.adjust', 'inventory', 'Điều chỉnh tồn kho', { directorOnly: true, sensitive: true }),
  p('inventory.posted_edit.approve', 'inventory', 'Phê duyệt sửa chứng từ đã ghi sổ', {
    directorOnly: true,
    sensitive: true,
  }),
  p('inventory.reverse', 'inventory', 'Giao dịch đảo / điều chỉnh sửa sai', {
    directorOnly: true,
    sensitive: true,
  }),
  p('inventory.status.change', 'inventory', 'Chuyển trạng thái hàng (lỗi, bảo hành, trả lại)'),

  // Đơn hàng
  p('order.read', 'order', 'Xem đơn hàng', { scoped: true }),
  p('order.create', 'order', 'Tạo đơn hàng'),
  p('order.update', 'order', 'Sửa đơn nháp', { scoped: true }),
  p('order.confirm', 'order', 'Xác nhận đơn', { scoped: true }),
  p('order.cancel', 'order', 'Hủy đơn', { scoped: true, sensitive: true }),
  p('order.fulfill', 'order', 'Xuất hàng / giao hàng / hoàn tất đơn', { scoped: true }),
  p('order.return.request', 'order', 'Tạo yêu cầu trả/đổi hàng', { scoped: true }),
  p('order.return.approve', 'order', 'Duyệt trả/đổi hàng', { sensitive: true }),

  // Thanh toán & hoàn tiền
  p('payment.read', 'payment', 'Xem thanh toán và công nợ', { scoped: true }),
  p('payment.record', 'payment', 'Ghi nhận thanh toán', { scoped: true, sensitive: true }),
  p('payment.void', 'payment', 'Hủy ghi nhận thanh toán sai', { sensitive: true }),
  p('payment.reconcile', 'payment', 'Đối soát thanh toán', { sensitive: true }),
  p('refund.request', 'payment', 'Tạo yêu cầu hoàn tiền', { scoped: true }),
  p('refund.approve', 'payment', 'Phê duyệt hoàn tiền', { directorOnly: true, sensitive: true }),
  p('refund.execute', 'payment', 'Thực hiện hoàn tiền', { directorOnly: true, sensitive: true }),

  // Hoa hồng
  p('commission.read', 'commission', 'Xem hoa hồng', { scoped: true }),
  p('commission.policy.manage', 'commission', 'Cấu hình tỷ lệ/phiên bản chính sách hoa hồng', {
    sensitive: true,
  }),
  p('commission.approve', 'commission', 'Duyệt hoa hồng', { sensitive: true }),
  p('commission.pay', 'commission', 'Ghi nhận chi hoa hồng', { sensitive: true }),
  p('commission.period.close', 'commission', 'Chốt kỳ hoa hồng', { sensitive: true }),

  // Báo cáo & thông báo
  p('dashboard.director.read', 'report', 'Xem dashboard giám đốc'),
  p('dashboard.staff.read', 'report', 'Xem dashboard nhân viên'),
  p('report.sales.read', 'report', 'Xem báo cáo bán hàng', { scoped: true }),
  p('report.finance.read', 'report', 'Xem báo cáo tài chính', { sensitive: true }),
  p('report.inventory.read', 'report', 'Xem báo cáo kho'),
  p('notification.read', 'report', 'Nhận thông báo trong ứng dụng'),
] as const satisfies readonly PermissionDef[];

export type PermissionKey = (typeof PERMISSIONS)[number]['key'];

export const PERMISSION_KEYS = PERMISSIONS.map((d) => d.key) as PermissionKey[];

const byKey = new Map<string, PermissionDef>(PERMISSIONS.map((d) => [d.key, d]));

export function getPermission(key: string): PermissionDef | undefined {
  return byKey.get(key);
}

export function isPermissionKey(key: string): key is PermissionKey {
  return byKey.has(key);
}

export const DIRECTOR_ONLY_PERMISSIONS = PERMISSIONS.filter(
  (d: PermissionDef) => d.directorOnly === true,
).map((d) => d.key) as PermissionKey[];
