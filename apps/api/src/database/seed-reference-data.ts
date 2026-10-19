import {
  DEFAULT_ROLE_GRANTS,
  PERMISSIONS,
  ROLE_CODES,
  ROLE_LABELS,
  validateGrant,
  type PermissionDef,
  type Scope,
} from '@crm/shared';
import type { PrismaClient } from '../generated/prisma/client';

export interface SeedResult {
  permissionsCreated: number;
  permissionsUpdated: number;
  rolesCreated: number;
  grantsCreated: number;
}

/**
 * Đồng bộ DỮ LIỆU THAM CHIẾU (không phải dữ liệu nghiệp vụ): danh mục quyền, vai trò hệ thống,
 * và ma trận quyền mặc định.
 *
 * Idempotent và không ghi đè tùy chỉnh của quản trị viên:
 * - Quyền: tạo mới hoặc cập nhật nhãn/cờ theo mã nguồn.
 * - Vai trò hệ thống: tạo nếu chưa có; không đổi tên vai trò đã có.
 * - Ma trận: chỉ gán mặc định cho vai trò mới tạo, hoặc cho quyền mới xuất hiện ở lần chạy này.
 *   Quyền mà quản trị viên đã gỡ khỏi vai trò sẽ KHÔNG bị gán lại.
 *
 * Không tạo tài khoản người dùng nào (không có admin mặc định).
 */
export async function seedReferenceData(prisma: PrismaClient): Promise<SeedResult> {
  return prisma.$transaction(async (tx) => {
    const existingPermissionKeys = new Set(
      (await tx.permission.findMany({ select: { key: true } })).map((p) => p.key),
    );
    const existingRoles = new Map(
      (await tx.role.findMany({ select: { id: true, code: true } })).map((r) => [r.code, r.id]),
    );

    let permissionsCreated = 0;
    let permissionsUpdated = 0;
    for (const def of PERMISSIONS as readonly PermissionDef[]) {
      const data = {
        module: def.module,
        label: def.label,
        scoped: def.scoped,
        directorOnly: def.directorOnly ?? false,
        sensitive: def.sensitive ?? false,
      };
      await tx.permission.upsert({ where: { key: def.key }, create: { key: def.key, ...data }, update: data });
      if (existingPermissionKeys.has(def.key)) permissionsUpdated++;
      else permissionsCreated++;
    }

    let rolesCreated = 0;
    let grantsCreated = 0;
    for (const code of ROLE_CODES) {
      let roleId = existingRoles.get(code);
      const isNewRole = roleId === undefined;
      if (isNewRole) {
        roleId = (
          await tx.role.create({ data: { code, name: ROLE_LABELS[code], isSystem: true } })
        ).id;
        rolesCreated++;
      }
      const grants = Object.entries(DEFAULT_ROLE_GRANTS[code]) as [string, Scope][];
      const toCreate = grants.filter(([key]) => isNewRole || !existingPermissionKeys.has(key));
      for (const [key, scope] of toCreate) validateGrant(code, key, scope);
      if (toCreate.length > 0) {
        const res = await tx.rolePermission.createMany({
          data: toCreate.map(([permissionKey, scope]) => ({ roleId: roleId!, permissionKey, scope })),
          skipDuplicates: true,
        });
        grantsCreated += res.count;
      }
    }

    return { permissionsCreated, permissionsUpdated, rolesCreated, grantsCreated };
  });
}
