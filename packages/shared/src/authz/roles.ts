/** Vai trò hệ thống mặc định. Mã vai trò ổn định; nhãn hiển thị tiếng Việt. */
export const ROLE_CODES = [
  'SUPER_ADMIN',
  'DIRECTOR',
  'TEAM_LEAD',
  'SALES',
  'CUSTOMER_SERVICE',
  'WAREHOUSE',
  'ACCOUNTANT',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_LABELS: Record<RoleCode, string> = {
  SUPER_ADMIN: 'Quản trị hệ thống',
  DIRECTOR: 'Giám đốc',
  TEAM_LEAD: 'Trưởng nhóm',
  SALES: 'Nhân viên kinh doanh',
  CUSTOMER_SERVICE: 'Chăm sóc khách hàng',
  WAREHOUSE: 'Nhân viên kho',
  ACCOUNTANT: 'Kế toán',
};

/** Vai trò bắt buộc bật MFA (đề xuất; xem OPEN_DECISIONS D-07). */
export const MFA_REQUIRED_ROLES: readonly RoleCode[] = ['SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT'];
