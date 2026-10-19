import {
  PERMISSIONS,
  SCOPE_RANK,
  getPermission,
  type PermissionKey,
  type Scope,
} from './permissions';
import { ROLE_CODES, type RoleCode } from './roles';

/**
 * Ma trận quyền MẶC ĐỊNH. Đây là dữ liệu khởi tạo (seed) cho bảng `role_permissions`;
 * tại runtime backend đọc quyền từ database, không đọc hằng số này. Super Admin có thể chỉnh
 * ma trận trong giới hạn của `validateGrant` (quyền `directorOnly` chỉ thuộc Giám đốc).
 *
 * Với quyền không phân phạm vi (`scoped: false`), giá trị luôn là 'ORG'.
 */
export type RoleGrants = Partial<Record<PermissionKey, Scope>>;

const all = (scope: Scope, exclude: PermissionKey[] = []): RoleGrants =>
  Object.fromEntries(
    PERMISSIONS.filter((d) => !exclude.includes(d.key)).map((d) => [
      d.key,
      d.scoped ? scope : 'ORG',
    ]),
  ) as RoleGrants;

const grant = (scope: Scope, keys: PermissionKey[]): RoleGrants =>
  Object.fromEntries(keys.map((k) => [k, getPermission(k)?.scoped ? scope : 'ORG'])) as RoleGrants;

const STAFF_COMMON: PermissionKey[] = [
  'task.read',
  'task.update',
  'schedule.read',
  'kpi.read',
  'commission.read',
  'dashboard.staff.read',
  'notification.read',
  'product.read',
  'inventory.read',
];

export const DEFAULT_ROLE_GRANTS: Record<RoleCode, RoleGrants> = {
  SUPER_ADMIN: grant('ORG', [
    'system.settings.manage',
    'user.read',
    'user.manage',
    'user.lock',
    'user.session.revoke',
    'role.read',
    'role.manage',
    'audit.read',
    'notification.read',
  ]),

  DIRECTOR: all('ORG', ['system.settings.manage', 'role.manage']),

  TEAM_LEAD: {
    ...grant('OWN', STAFF_COMMON),
    ...grant('TEAM', [
      'customer.read',
      'customer.update',
      'customer.assign',
      'customer.merge',
      'customer.export',
      'customer.consent.update',
      'care.log',
      'lead.read',
      'lead.update',
      'lead.assign',
      'lead.reopen',
      'task.read',
      'task.create',
      'task.update',
      'task.handover',
      'schedule.read',
      'schedule.manage',
      'employee.read',
      'kpi.read',
      'kpi.manage',
      'performance.review',
      'price_exception.request',
      'order.read',
      'order.update',
      'order.confirm',
      'order.cancel',
      'order.fulfill',
      'order.return.request',
      'payment.read',
      'payment.record',
      'refund.request',
      'commission.read',
      'report.sales.read',
    ]),
    ...grant('ORG', ['customer.create', 'lead.create', 'order.create', 'product.cost.read']),
  },

  SALES: {
    ...grant('OWN', [
      ...STAFF_COMMON,
      'customer.read',
      'customer.update',
      'customer.consent.update',
      'care.log',
      'lead.read',
      'lead.update',
      'price_exception.request',
      'order.read',
      'order.update',
      'order.confirm',
      'order.cancel',
      'order.fulfill',
      'order.return.request',
      'payment.read',
      'payment.record',
      'refund.request',
      'report.sales.read',
    ]),
    ...grant('ORG', ['customer.create', 'lead.create', 'order.create']),
  },

  CUSTOMER_SERVICE: {
    ...grant('OWN', [...STAFF_COMMON, 'lead.read', 'lead.update']),
    ...grant('STORE', [
      'customer.read',
      'customer.update',
      'customer.consent.update',
      'care.log',
      'order.read',
      'order.return.request',
      'payment.read',
      'refund.request',
    ]),
    ...grant('ORG', ['customer.create', 'lead.create']),
  },

  WAREHOUSE: {
    ...grant('OWN', STAFF_COMMON),
    ...grant('STORE', ['order.read', 'order.fulfill']),
    ...grant('ORG', [
      'inventory.document.create',
      'inventory.document.post',
      'inventory.stocktake.count',
      'inventory.status.change',
      'report.inventory.read',
    ]),
  },

  ACCOUNTANT: {
    ...grant('OWN', STAFF_COMMON),
    ...grant('ORG', [
      'customer.read',
      'order.read',
      'payment.read',
      'payment.record',
      'payment.reconcile',
      'payment.void',
      'refund.request',
      'product.cost.read',
      'commission.read',
      'commission.pay',
      'report.finance.read',
      'report.sales.read',
      'report.inventory.read',
    ]),
  },
};

export class GrantViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GrantViolationError';
  }
}

/**
 * QUY TẮC ĐÃ KHÓA: quyền `directorOnly` không được gán cho vai trò khác Giám đốc.
 * Backend gọi hàm này mỗi khi ghi `role_permissions`; DB có thêm trigger kiểm tra (Sprint 1).
 */
export function validateGrant(role: RoleCode, key: string, scope: Scope): void {
  const def = getPermission(key);
  if (!def) throw new GrantViolationError(`Quyền không tồn tại: ${key}`);
  if (def.directorOnly && role !== 'DIRECTOR') {
    throw new GrantViolationError(`Quyền "${key}" chỉ dành cho Giám đốc (quy tắc đã khóa)`);
  }
  if (!def.scoped && scope !== 'ORG') {
    throw new GrantViolationError(`Quyền "${key}" không phân phạm vi, chỉ nhận ORG`);
  }
}

/** Phạm vi hiệu lực lớn nhất của một quyền trên tập vai trò của nhân viên. */
export function resolveScope(
  grantsByRole: Partial<Record<RoleCode, RoleGrants>>,
  roles: readonly RoleCode[],
  key: PermissionKey,
): Scope | null {
  let best: Scope | null = null;
  for (const role of roles) {
    const s = grantsByRole[role]?.[key];
    if (s && (!best || SCOPE_RANK[s] > SCOPE_RANK[best])) best = s;
  }
  return best;
}

export function assertDefaultGrantsValid(): void {
  for (const role of ROLE_CODES) {
    for (const [key, scope] of Object.entries(DEFAULT_ROLE_GRANTS[role])) {
      validateGrant(role, key, scope as Scope);
    }
  }
}
