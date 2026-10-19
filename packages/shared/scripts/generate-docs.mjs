// Sinh tài liệu từ mã nguồn @crm/shared (nguồn sự thật duy nhất):
//   docs/security/PERMISSION_MATRIX.md
//   docs/architecture/STATE_MACHINES.generated.md
// Chạy: pnpm --filter @crm/shared gen:docs  (CI kiểm tra tài liệu không bị lệch).
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import shared from '../dist/index.js';

const { PERMISSIONS, ROLE_CODES, ROLE_LABELS, DEFAULT_ROLE_GRANTS, ALL_MACHINES, toMermaid } =
  shared;
const root = resolve(import.meta.dirname, '../../..');
const HEADER =
  '<!-- TỆP SINH TỰ ĐỘNG từ packages/shared — không sửa tay. Chạy `pnpm docs:generate`. -->\n\n';

const SCOPE_LABEL = { OWN: 'Của mình', TEAM: 'Nhóm', STORE: 'Cửa hàng', ORG: '✔' };

function permissionMatrix() {
  const lines = [HEADER, '# Ma trận phân quyền mặc định\n'];
  lines.push(
    'Giá trị ô: `✔` = có quyền (toàn tổ chức hoặc quyền không phân phạm vi); `Của mình` / `Nhóm` / `Cửa hàng` = phạm vi dữ liệu; trống = không có quyền.',
    '',
    '🔒 = **quyền chỉ dành cho Giám đốc (quy tắc đã khóa)** — không thể gán cho vai trò khác, kể cả bởi Super Admin; được chặn ở 3 lớp: `validateGrant` (ứng dụng), trigger `crm_check_role_permission` (database), kiểm thử tích hợp.',
    '⚠️ = quyền nhạy cảm: bắt buộc ghi audit log.',
    '',
    'Đây là dữ liệu khởi tạo; tại runtime backend đọc ma trận từ bảng `role_permissions`.',
    '',
    '| Vai trò | Mã |',
    '|---|---|',
    ...ROLE_CODES.map((r) => `| ${ROLE_LABELS[r]} | \`${r}\` |`),
    '',
  );
  const modules = [...new Set(PERMISSIONS.map((p) => p.module))];
  for (const mod of modules) {
    lines.push(`## Module \`${mod}\`\n`);
    lines.push(`| Quyền | Mô tả | ${ROLE_CODES.map((r) => ROLE_LABELS[r]).join(' | ')} |`);
    lines.push(`|---|---|${ROLE_CODES.map(() => ':-:').join('|')}|`);
    for (const p of PERMISSIONS.filter((x) => x.module === mod)) {
      const flags = `${p.directorOnly ? ' 🔒' : ''}${p.sensitive ? ' ⚠️' : ''}`;
      const cells = ROLE_CODES.map((r) => {
        const s = DEFAULT_ROLE_GRANTS[r][p.key];
        return s ? SCOPE_LABEL[s] : '';
      });
      lines.push(`| \`${p.key}\`${flags} | ${p.label} | ${cells.join(' | ')} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function stateMachines() {
  const lines = [HEADER, '# State machine (sinh từ mã nguồn)\n'];
  lines.push(
    'Giải thích thiết kế: [STATE_MACHINES.md](./STATE_MACHINES.md). Định nghĩa: `packages/shared/src/state-machines/machines.ts`.\n',
  );
  for (const m of ALL_MACHINES) {
    lines.push(`## ${m.label} (\`${m.id}\`)\n`);
    lines.push('```mermaid', toMermaid(m), '```', '');
    lines.push('| Trạng thái | Ý nghĩa |', '|---|---|');
    for (const s of m.states) {
      const tag = m.initial.includes(s)
        ? ' (khởi đầu)'
        : m.terminal.includes(s)
          ? ' (kết thúc)'
          : '';
      lines.push(`| \`${s}\`${tag} | ${m.stateLabels[s]} |`);
    }
    lines.push(
      '',
      '| Sự kiện | Từ | Đến | Quyền | Điều kiện bắt buộc | Mô tả |',
      '|---|---|---|---|---|---|',
    );
    for (const t of m.transitions) {
      lines.push(
        `| \`${t.event}\` | ${t.from.map((f) => `\`${f}\``).join(', ')} | \`${t.to}\` | ${t.permission ? `\`${t.permission}\`` : '_hệ thống_'} | ${(t.guards ?? []).map((g) => `\`${g}\``).join('<br>')} | ${t.description} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

writeFileSync(resolve(root, 'docs/security/PERMISSION_MATRIX.md'), permissionMatrix());
writeFileSync(resolve(root, 'docs/architecture/STATE_MACHINES.generated.md'), stateMachines());
console.log(
  'Đã sinh docs/security/PERMISSION_MATRIX.md và docs/architecture/STATE_MACHINES.generated.md',
);
