import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROLE_GRANTS,
  DIRECTOR_ONLY_PERMISSIONS,
  GrantViolationError,
  PERMISSIONS,
  ROLE_CODES,
  assertDefaultGrantsValid,
  resolveScope,
  validateGrant,
  type PermissionKey,
} from './index';

describe('ma trận quyền mặc định', () => {
  it('khóa quyền không trùng', () => {
    const keys = PERMISSIONS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('hợp lệ theo mọi ràng buộc', () => {
    expect(() => assertDefaultGrantsValid()).not.toThrow();
  });

  it('QUY TẮC ĐÃ KHÓA: quyền chỉ-giám-đốc gồm duyệt giá sàn, điều chỉnh/đảo kho, duyệt và thực hiện hoàn tiền', () => {
    expect([...DIRECTOR_ONLY_PERMISSIONS].sort()).toEqual(
      [
        'inventory.adjust',
        'inventory.posted_edit.approve',
        'inventory.reverse',
        'price_exception.approve',
        'refund.approve',
        'refund.execute',
      ].sort(),
    );
  });

  it.each(ROLE_CODES.filter((r) => r !== 'DIRECTOR'))(
    'vai trò %s không có quyền chỉ-giám-đốc nào',
    (role) => {
      for (const key of DIRECTOR_ONLY_PERMISSIONS) {
        expect(DEFAULT_ROLE_GRANTS[role][key]).toBeUndefined();
      }
    },
  );

  it('Giám đốc có đủ quyền chỉ-giám-đốc', () => {
    for (const key of DIRECTOR_ONLY_PERMISSIONS) {
      expect(DEFAULT_ROLE_GRANTS.DIRECTOR[key]).toBe('ORG');
    }
  });

  it('từ chối gán quyền chỉ-giám-đốc cho vai trò khác, kể cả Super Admin', () => {
    expect(() => validateGrant('SUPER_ADMIN', 'refund.approve', 'ORG')).toThrow(
      GrantViolationError,
    );
    expect(() => validateGrant('WAREHOUSE', 'inventory.adjust', 'ORG')).toThrow(
      GrantViolationError,
    );
    expect(() => validateGrant('DIRECTOR', 'inventory.adjust', 'ORG')).not.toThrow();
  });

  it('từ chối quyền không tồn tại và phạm vi sai', () => {
    expect(() => validateGrant('SALES', 'order.delete_everything', 'ORG')).toThrow(
      GrantViolationError,
    );
    expect(() => validateGrant('SALES', 'order.create', 'OWN')).toThrow(GrantViolationError);
  });

  it('nhân viên kinh doanh chỉ thấy khách được giao (OWN)', () => {
    expect(DEFAULT_ROLE_GRANTS.SALES['customer.read']).toBe('OWN');
    expect(DEFAULT_ROLE_GRANTS.SALES['product.cost.read']).toBeUndefined();
  });

  it('nhân viên kho không được điều chỉnh tồn nhưng được ghi sổ chứng từ đã duyệt', () => {
    expect(DEFAULT_ROLE_GRANTS.WAREHOUSE['inventory.adjust']).toBeUndefined();
    expect(DEFAULT_ROLE_GRANTS.WAREHOUSE['inventory.document.post']).toBe('ORG');
    expect(DEFAULT_ROLE_GRANTS.WAREHOUSE['inventory.document.approve']).toBeUndefined();
  });

  it('nhân viên chỉ tạo yêu cầu hoàn tiền', () => {
    for (const role of ['SALES', 'CUSTOMER_SERVICE', 'ACCOUNTANT', 'TEAM_LEAD'] as const) {
      expect(DEFAULT_ROLE_GRANTS[role]['refund.request']).toBeDefined();
      expect(DEFAULT_ROLE_GRANTS[role]['refund.approve']).toBeUndefined();
      expect(DEFAULT_ROLE_GRANTS[role]['refund.execute']).toBeUndefined();
    }
  });

  it('resolveScope lấy phạm vi rộng nhất trên nhiều vai trò', () => {
    const key: PermissionKey = 'customer.read';
    expect(resolveScope(DEFAULT_ROLE_GRANTS, ['SALES'], key)).toBe('OWN');
    expect(resolveScope(DEFAULT_ROLE_GRANTS, ['SALES', 'TEAM_LEAD'], key)).toBe('TEAM');
    expect(resolveScope(DEFAULT_ROLE_GRANTS, ['WAREHOUSE'], key)).toBeNull();
  });
});
