import { DEFAULT_ROLE_GRANTS, DIRECTOR_ONLY_PERMISSIONS, PERMISSIONS, ROLE_CODES } from '@crm/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedReferenceData } from '../../src/database/seed-reference-data';
import type { PrismaClient } from '../../src/generated/prisma/client';
import { createTestPrisma, pgError } from './helpers';

let prisma: PrismaClient;
let orgId: string;
let storeId: string;

beforeAll(async () => {
  prisma = createTestPrisma();
  await seedReferenceData(prisma);
  const org = await prisma.organization.create({ data: { code: 'TEST_ORG', name: 'Tổ chức kiểm thử' } });
  orgId = org.id;
  storeId = (await prisma.store.create({ data: { organizationId: orgId, code: 'S01', name: 'Cửa hàng 1' } })).id;
});

afterAll(async () => {
  await prisma?.$disconnect();
});

const roleId = async (code: string) => (await prisma.role.findUniqueOrThrow({ where: { code } })).id;

describe('dữ liệu tham chiếu (seed)', () => {
  it('tạo đủ quyền, 7 vai trò hệ thống và ma trận mặc định', async () => {
    expect(await prisma.permission.count()).toBe(PERMISSIONS.length);
    expect(await prisma.role.count({ where: { isSystem: true } })).toBe(ROLE_CODES.length);
    for (const code of ROLE_CODES) {
      const rows = await prisma.rolePermission.findMany({ where: { role: { code } } });
      const actual = Object.fromEntries(rows.map((r) => [r.permissionKey, r.scope]));
      expect(actual).toEqual(DEFAULT_ROLE_GRANTS[code]);
    }
  });

  it('không tạo tài khoản người dùng mặc định nào', async () => {
    expect(await prisma.user.count()).toBe(0);
  });

  it('chạy lại không tạo trùng và không gán lại quyền quản trị viên đã gỡ', async () => {
    const sales = await roleId('SALES');
    await prisma.rolePermission.delete({
      where: { roleId_permissionKey: { roleId: sales, permissionKey: 'payment.record' } },
    });
    const second = await seedReferenceData(prisma);
    expect(second).toEqual({
      permissionsCreated: 0,
      permissionsUpdated: PERMISSIONS.length,
      rolesCreated: 0,
      grantsCreated: 0,
    });
    const regranted = await prisma.rolePermission.findUnique({
      where: { roleId_permissionKey: { roleId: sales, permissionKey: 'payment.record' } },
    });
    expect(regranted).toBeNull();
  });
});

describe('QUY TẮC ĐÃ KHÓA ở mức database: quyền chỉ-giám-đốc', () => {
  it.each(DIRECTOR_ONLY_PERMISSIONS)('không gán được %s cho SUPER_ADMIN, kể cả bằng SQL thô', async (key) => {
    const id = await roleId('SUPER_ADMIN');
    const msg = await pgError(
      prisma.$executeRaw`INSERT INTO role_permissions (role_id, permission_key, scope) VALUES (${id}::uuid, ${key}, 'ORG')`,
    );
    expect(msg).toContain('CRM_DIRECTOR_ONLY');
  });

  it('không chuyển quyền chỉ-giám-đốc sang vai trò khác bằng UPDATE', async () => {
    const director = await roleId('DIRECTOR');
    const warehouse = await roleId('WAREHOUSE');
    const msg = await pgError(
      prisma.$executeRaw`UPDATE role_permissions SET role_id = ${warehouse}::uuid WHERE role_id = ${director}::uuid AND permission_key = 'inventory.adjust'`,
    );
    expect(msg).toContain('CRM_DIRECTOR_ONLY');
  });

  it('không đổi mã vai trò DIRECTOR để chiếm quyền', async () => {
    const msg = await pgError(prisma.role.update({ where: { code: 'DIRECTOR' }, data: { code: 'HACKED' } }));
    expect(msg).toContain('CRM_DIRECTOR_ONLY');
  });

  it('không bật director_only cho quyền đang gán cho vai trò khác', async () => {
    const msg = await pgError(
      prisma.permission.update({ where: { key: 'order.create' }, data: { directorOnly: true } }),
    );
    expect(msg).toContain('CRM_DIRECTOR_ONLY');
  });

  it('quyền không phân phạm vi chỉ nhận scope ORG', async () => {
    const custom = await prisma.role.create({ data: { code: 'CUSTOM_TEST', name: 'Vai trò thử' } });
    const msg = await pgError(
      prisma.rolePermission.create({ data: { roleId: custom.id, permissionKey: 'order.create', scope: 'OWN' } }),
    );
    expect(msg).toContain('CRM_SCOPE_INVALID');
  });
});

describe('audit_logs và access_logs chỉ cho phép thêm mới', () => {
  it('INSERT được; UPDATE, DELETE, TRUNCATE bị chặn', async () => {
    const log = await prisma.auditLog.create({
      data: { action: 'test.created', entityType: 'test', entityId: '1', after: { a: 1 } },
    });
    expect(await pgError(prisma.auditLog.update({ where: { id: log.id }, data: { action: 'tampered' } }))).toContain(
      'CRM_APPEND_ONLY',
    );
    expect(await pgError(prisma.auditLog.delete({ where: { id: log.id } }))).toContain('CRM_APPEND_ONLY');
    expect(await pgError(prisma.$executeRawUnsafe('TRUNCATE audit_logs'))).toContain('CRM_APPEND_ONLY');

    const access = await prisma.accessLog.create({ data: { event: 'LOGIN_FAILED', identifier: 'x@y.vn' } });
    expect(await pgError(prisma.accessLog.delete({ where: { id: access.id } }))).toContain('CRM_APPEND_ONLY');
    expect(await prisma.auditLog.count({ where: { id: log.id, action: 'test.created' } })).toBe(1);
  });
});

describe('ràng buộc toàn vẹn khác', () => {
  it('email nhân viên unique không phân biệt hoa thường', async () => {
    await prisma.user.create({ data: { organizationId: orgId, email: 'Lan.Nguyen@cty.vn', fullName: 'Nguyễn Lan' } });
    const msg = await pgError(
      prisma.user.create({ data: { organizationId: orgId, email: 'lan.nguyen@CTY.vn', fullName: 'Trùng' } }),
    );
    expect(msg).toMatch(/users_organization_id_email_lower_key|Unique constraint/);
  });

  it('tài khoản ACTIVE bắt buộc có mật khẩu đã hash; MFA bật phải có secret', async () => {
    expect(
      await pgError(
        prisma.user.create({
          data: { organizationId: orgId, email: 'a1@cty.vn', fullName: 'A', status: 'ACTIVE' },
        }),
      ),
    ).toMatch(/users_active_requires_password/);
    expect(
      await pgError(
        prisma.user.create({ data: { organizationId: orgId, email: 'a2@cty.vn', fullName: 'B', mfaEnabled: true } }),
      ),
    ).toMatch(/users_mfa_requires_secret/);
  });

  it('vai trò gán một lần cho cùng phạm vi cửa hàng, kể cả phạm vi toàn hệ thống (NULL)', async () => {
    const u = await prisma.user.create({ data: { organizationId: orgId, email: 'b1@cty.vn', fullName: 'C' } });
    const sales = await roleId('SALES');
    await prisma.userRole.create({ data: { userId: u.id, roleId: sales } });
    expect(await pgError(prisma.userRole.create({ data: { userId: u.id, roleId: sales } }))).toMatch(
      /user_roles_user_role_all_stores_key|Unique constraint/,
    );
    await prisma.userRole.create({ data: { userId: u.id, roleId: sales, storeId } });
    expect(await pgError(prisma.userRole.create({ data: { userId: u.id, roleId: sales, storeId } }))).toMatch(
      /user_roles_user_role_store_key|Unique constraint/,
    );
  });

  it('mỗi tổ chức chỉ một kho chính', async () => {
    await prisma.warehouse.create({ data: { organizationId: orgId, storeId, code: 'KHO1', name: 'Kho chính', isMain: true } });
    expect(
      await pgError(
        prisma.warehouse.create({ data: { organizationId: orgId, code: 'KHO2', name: 'Kho 2', isMain: true } }),
      ),
    ).toMatch(/warehouses_one_main_per_org|Unique constraint/);
  });

  it('mã cửa hàng/kho đúng định dạng', async () => {
    expect(
      await pgError(prisma.store.create({ data: { organizationId: orgId, code: 'cửa hàng', name: 'x' } })),
    ).toMatch(/stores_code_format/);
  });

  it('phiên chỉ lưu hash SHA-256 hex của token, hạn sau thời điểm tạo', async () => {
    const u = await prisma.user.create({ data: { organizationId: orgId, email: 's1@cty.vn', fullName: 'S' } });
    expect(
      await pgError(
        prisma.session.create({
          data: { userId: u.id, tokenHash: 'raw-token-should-not-be-stored'.padEnd(64, 'x'), expiresAt: new Date(Date.now() + 1e6) },
        }),
      ),
    ).toMatch(/sessions_token_hash_hex/);
    expect(
      await pgError(
        prisma.session.create({
          data: { userId: u.id, tokenHash: 'a'.repeat(64), createdAt: new Date(), expiresAt: new Date(Date.now() - 1000) },
        }),
      ),
    ).toMatch(/sessions_expiry_after_creation/);
  });
});
