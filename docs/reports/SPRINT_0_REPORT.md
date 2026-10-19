# Báo cáo Sprint 0 — Foundation & Architecture

- Ngày: 2026-10-19
- Nhánh: `sprint-0/foundation` (repository `ChuuChenn/business-crm`; repository trống trước sprint)
- Môi trường kiểm thử: container Linux, Node 22.22.0, pnpm 10.28.0, Docker 29.8.2 (Compose v5.6),
  PostgreSQL 16 và Redis 7 chạy bằng `docker compose`.

## 1. Đánh giá: **CONDITIONAL GO**

Mọi tiêu chí nghiệm thu bắt buộc của Sprint 0 đạt và đã chạy kiểm thử thực tế (mục 6). Không có lỗi
Critical/High đang mở. CI trên GitHub Actions đã chạy xanh cả 3 job trên PR #1 (commit `48cd04b`).
Điều kiện còn lại trước khi bắt đầu Sprint 1:

1. **Chủ doanh nghiệp chốt D-07, D-11, D-12** trong [OPEN_DECISIONS.md](../business-rules/OPEN_DECISIONS.md)
   (MFA bắt buộc cho vai trò nào; Super Admin có xem dữ liệu kinh doanh không; ai được gán vai trò
   Giám đốc). Ba điểm này ảnh hưởng phân quyền nên không tự giả định.

## 2. Tiêu chí nghiệm thu

| #   | Tiêu chí                                                            | Kết quả | Bằng chứng                                                                    |
| --- | ------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| 1   | Kiểm tra môi trường, repository                                     | Đạt     | Repo trống → commit khởi tạo `main`, làm việc trên nhánh sprint               |
| 2   | Tài liệu kiến trúc                                                  | Đạt     | `docs/architecture/ARCHITECTURE.md`, `DECISIONS.md` (8 ADR)                   |
| 3   | Thiết kế database cho các module cốt lõi                            | Đạt     | `docs/database/ERD.md`: 7 nhóm bảng, ràng buộc toàn vẹn cho tiền/kho/hoa hồng |
| 4   | Permission matrix                                                   | Đạt     | 74 quyền × 7 vai trò, sinh từ mã nguồn: `docs/security/PERMISSION_MATRIX.md`  |
| 5   | State machine đơn, kho, thanh toán, giá ngoại lệ, hoa hồng          | Đạt     | 10 máy trạng thái thực thi được trong `@crm/shared` + sơ đồ sinh tự động      |
| 6   | Khởi tạo Next.js                                                    | Đạt     | `apps/web`                                                                    |
| 7   | Khởi tạo NestJS                                                     | Đạt     | `apps/api`                                                                    |
| 8   | PostgreSQL + Redis bằng Docker Compose                              | Đạt     | `docker-compose.yml`, healthcheck `healthy`                                   |
| 9   | Migration nền tảng                                                  | Đạt     | 2 migration, áp dụng trên DB dev và DB test; không drift                      |
| 10  | Health check API                                                    | Đạt     | `/api/v1/health`, `/api/v1/health/ready` (200 / 503)                          |
| 11  | Giao diện nền tảng: sidebar, topbar, dashboard chưa có dữ liệu thật | Đạt     | E2E desktop + điện thoại                                                      |
| 12  | Lint, typecheck, test, build                                        | Đạt     | Mục 6                                                                         |
| 13  | Kiểm thử thực tế                                                    | Đạt     | Mục 6                                                                         |
| 14  | Báo cáo                                                             | Đạt     | Tài liệu này                                                                  |

## 3. Chức năng đã hoàn thành

**Nền tảng chung (`packages/shared`)**

- Tiền VND bằng `bigint`, tỷ lệ basis point, làm tròn tường minh (HALF_UP/FLOOR/CEIL), tách VAT,
  công thức đã khóa: lợi nhuận gộp và hoa hồng `MAX(0, LNG) × tỷ lệ`, chia hoa hồng nhiều người
  không lệch đồng nào.
- Múi giờ nghiệp vụ `Asia/Ho_Chi_Minh`: ngày/kỳ tháng nghiệp vụ, khoảng UTC của kỳ (cho chốt hoa hồng).
- 7 vai trò, 74 quyền có phạm vi `OWN/TEAM/STORE/ORG`, ma trận mặc định, 6 quyền chỉ-giám-đốc
  (duyệt giá sàn, điều chỉnh tồn, duyệt sửa chứng từ đã ghi sổ, giao dịch đảo, duyệt/thực hiện hoàn tiền).
- 10 state machine: đơn hàng, ngoại lệ giá sàn, chứng từ kho, hàng serial, thanh toán, hoàn tiền,
  hoa hồng, kỳ hoa hồng, lead, công việc.
- Schema Zod dùng chung (health, lỗi API, phân trang).

**API (`apps/api`)**

- NestJS 11 modular monolith: cấu hình kiểm tra bằng Zod (chặn production dùng mật khẩu mẫu), Prisma 7
  - adapter `pg`, Redis, log pino có che dữ liệu nhạy cảm và request id, helmet, CORS theo danh sách,
    rate limit toàn cục, định dạng lỗi chuẩn (không lộ stack/SQL), OpenAPI 3.1 + Swagger UI.
- Health liveness/readiness có timeout từng phụ thuộc.
- Seed dữ liệu tham chiếu idempotent: tạo danh mục quyền, vai trò, ma trận mặc định; **không tạo
  user nào**; không gán lại quyền mà quản trị viên đã gỡ.

**Database**

- Bảng nền tảng: tổ chức, cửa hàng, kho, nhóm, nhân viên, vai trò, quyền, gán vai trò theo cửa hàng,
  phiên, nhật ký truy cập, audit log, idempotency key, cấu hình hệ thống, outbox.
- Ràng buộc trong DB: audit/access log append-only (chặn UPDATE/DELETE/TRUNCATE); quyền chỉ-giám-đốc
  chỉ gán được cho `DIRECTOR` (chặn cả INSERT, UPDATE chuyển vai trò, đổi mã vai trò, bật cờ);
  email không phân biệt hoa thường; 1 kho chính/tổ chức; 1 trưởng nhóm/nhóm; tài khoản ACTIVE phải có
  hash mật khẩu; phiên chỉ lưu SHA-256.

**Web (`apps/web`)**

- Khung SaaS tiếng Việt: sidebar theo phân hệ, topbar, menu trượt trên điện thoại, dark mode.
- Dashboard ở trạng thái rỗng (không có số giả), ghi rõ sprint sẽ có dữ liệu.
- Thẻ/trang “Trạng thái hệ thống” gọi API thật, đủ trạng thái loading / lỗi / thành công.
- Mục chưa triển khai hiển thị vô hiệu kèm sprint dự kiến; ô tìm kiếm và chuông thông báo vô hiệu kèm
  chú thích (không có nút trang trí).
- Proxy `/api` cùng origin đọc địa chỉ API lúc chạy.

**Hạ tầng**

- Docker Compose: PostgreSQL, Redis, RustFS (S3), Mailpit; profile `app`: migrate → API → web → Caddy.
- Dockerfile API (runtime chỉ dependency production, chạy user `node`) và web (Next standalone).
- CI GitHub Actions: format, lint, typecheck, unit, build, kiểm tra tài liệu sinh tự động, test tích hợp
  với service PostgreSQL/Redis, kiểm tra drift migration, E2E, build Docker.
- Script backup/restore (restore chỉ vào database mới, kiểm tra checksum).

## 4. File chính

| Khu vực            | File                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quy tắc dùng chung | `packages/shared/src/{money,time}.ts`, `src/authz/{roles,permissions,default-grants}.ts`, `src/state-machines/{machine,machines}.ts`                                                                                                                   |
| API                | `apps/api/src/{main,app.factory,app.module,openapi}.ts`, `src/config/env.ts`, `src/common/{filters/all-exceptions.filter,http/logger}.ts`, `src/modules/health/*`, `src/infrastructure/{prisma,redis}/*`, `src/database/{seed,seed-reference-data}.ts` |
| Database           | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/*`                                                                                                                                                                                        |
| Web                | `apps/web/src/app/(app)/{layout,page,error,loading}.tsx`, `src/app/(app)/system/status/page.tsx`, `src/app/api/[...path]/route.ts`, `src/components/layout/*`, `src/components/dashboard/*`, `src/config/navigation.ts`                                |
| UI                 | `packages/ui/src/components/*`                                                                                                                                                                                                                         |
| Test               | `packages/shared/src/**/*.test.ts`, `apps/api/test/{unit,integration}/*`, `apps/web/src/**/*.test.tsx`, `tests/e2e/specs/app-shell.spec.ts`                                                                                                            |
| Hạ tầng            | `docker-compose.yml`, `infrastructure/docker/{api,web}.Dockerfile`, `infrastructure/docker/caddy/Caddyfile`, `infrastructure/scripts/{backup,restore}.sh`, `.github/workflows/ci.yml`                                                                  |
| Tài liệu           | `docs/**`, `README.md`, `AGENTS.md`                                                                                                                                                                                                                    |

## 5. Database migrations

| Migration                                  | Nội dung                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `20261019171820_foundation`                | 16 bảng nền tảng, 4 enum, FK, 13 CHECK, index partial/biểu thức, 4 hàm trigger (append-only, quyền chỉ-giám-đốc ×3) |
| `20261019173000_user_roles_partial_unique` | Thay index `NULLS NOT DISTINCT` bằng 2 index partial (Prisma coi index cũ là drift)                                 |

## 6. Kết quả kiểm thử thực tế

Tất cả lệnh chạy từ gốc repo ngày 2026-10-19, với PostgreSQL + Redis thật trong Docker.

| Lệnh                                                                                          | Kết quả                                                                                                                                    |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm format:check`                                                                           | Đạt — “All matched files use Prettier code style!”                                                                                         |
| `pnpm lint --force`                                                                           | Đạt — Turbo: 6/6 task, 0 lỗi, 0 cảnh báo                                                                                                   |
| `pnpm typecheck --force`                                                                      | Đạt — Turbo: 6/6 task                                                                                                                      |
| `pnpm test --force`                                                                           | Đạt — `@crm/shared` 109/109, `@crm/api` 10/10, `@crm/web` 7/7 (**126 test**)                                                               |
| `pnpm build --force`                                                                          | Đạt — Turbo: 3/3 (shared, api, web; Next.js: `/`, `/system/status`, `/api/[...path]`)                                                      |
| `pnpm test:integration`                                                                       | Đạt — **29/29** (2 file: health API qua HTTP thật; ràng buộc/trigger DB + seed)                                                            |
| `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`   | Đạt — exit 0, không drift                                                                                                                  |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium pnpm test:e2e`                      | Đạt — **16 passed**, 2 skipped (test chỉ dành cho desktop bỏ qua trên mobile và ngược lại)                                                 |
| `node dist/database/seed.js` (2 lần)                                                          | Lần 1: 74 quyền, 7 vai trò, 209 gán quyền; lần 2: 0 tạo mới                                                                                |
| `NODE_ENV=production node dist/main.js` với mật khẩu dev                                      | API từ chối khởi động: “DATABASE_URL đang dùng mật khẩu mẫu/dev” (đúng thiết kế)                                                           |
| `curl /api/v1/health/ready` (API chạy thật)                                                   | `200 {"status":"ok", database up, redis up}`                                                                                               |
| `docker build` api / migrate / web                                                            | Đạt cả 3 image                                                                                                                             |
| `docker compose --profile app up` rồi `curl http://localhost:8080/api/v1/health/ready` và `/` | 200 qua Caddy; migrate “No pending migrations”; header `X-Frame-Options: DENY`, `nosniff`                                                  |
| `infrastructure/scripts/backup.sh` → `restore.sh … crm_restore_check`                         | Sao lưu 52 KB, khôi phục vào DB mới: 2 migration, 74 quyền, 209 gán quyền; chạy lại restore vào DB đã tồn tại → bị từ chối (đúng thiết kế) |
| `pnpm audit --prod`                                                                           | Ban đầu 1 lỗ hổng moderate (`js-yaml` qua `@nestjs/swagger`) → đã vá bằng override; sau vá: “No known vulnerabilities found”               |

Các kiểm thử quan trọng đã có:

- Không gán được quyền chỉ-giám-đốc cho Super Admin/vai trò khác **kể cả bằng SQL thô** (6 quyền),
  không lách được bằng UPDATE chuyển vai trò, đổi mã vai trò `DIRECTOR`, hoặc bật cờ `director_only`.
- Audit log không sửa/xóa/truncate được.
- Công thức hoa hồng theo lợi nhuận gộp (kể cả LNG âm → 0), chia hoa hồng không lệch tổng, làm tròn.
- State machine: trạng thái kết thúc không có lối ra, tất định, mọi trạng thái khả đạt, chỉ quyền
  giám đốc duyệt/thực hiện hoàn tiền và duyệt giá sàn, serial không xuất được hai lần, chứng từ POSTED
  chỉ có thể đảo.
- Log không chứa mật khẩu/token/cookie/bí mật MFA; lỗi 500 không lộ chuỗi kết nối.
- Readiness trả 503 khi Redis chết, liveness vẫn 200.

## 7. Lỗi đã phát hiện và sửa trong sprint

| Lỗi                                                  | Nguyên nhân                                               | Sửa                                                        |
| ---------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| Prisma báo drift với index `NULLS NOT DISTINCT`      | Prisma không biểu diễn được loại index này                | Migration mới thay bằng 2 index partial; CI kiểm tra drift |
| Readiness trả 503 ngay sau khởi động                 | Redis kết nối lười, lệnh đầu bị từ chối khi chưa sẵn sàng | Kết nối Redis trong `onModuleInit`                         |
| Proxy `/api` lỗi 500 khi API ở địa chỉ khác lúc chạy | Next.js `rewrites` đóng băng địa chỉ lúc build            | Route handler đọc `API_INTERNAL_URL` lúc chạy (ADR-007)    |
| Build web phụ thuộc mạng tới Google Fonts            | `next/font/google` tải font lúc build                     | Tự host font qua `@fontsource/be-vietnam-pro`              |
| Image MinIO không còn trên Docker Hub                | MinIO ngừng phát hành image cộng đồng                     | Thay bằng RustFS 1.0.3 (tương thích S3)                    |
| `pnpm deploy` lỗi trong Docker                       | Chế độ `--offline` thiếu metadata                         | Dùng `--prefer-offline`                                    |
| Lỗ hổng moderate `js-yaml`                           | Phụ thuộc bắc cầu của `@nestjs/swagger`                   | Override `js-yaml ^5.4.1`                                  |

## 8. Lỗi và hạn chế còn tồn tại

| Mức  | Vấn đề                                                                                                                    | Kế hoạch                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Low  | Image API 763 MB (pnpm deploy `--legacy` kéo theo nhiều file), image migrate 2,5 GB                                       | Tối ưu Sprint 1: bundle API, image migrate riêng chỉ có Prisma CLI             |
| Low  | RustFS và Mailpit chưa được khởi động thử trong môi trường này (Docker Hub giới hạn lượt tải 429); API chưa dùng S3/email | Khởi động thử khi cần (Sprint 1 email quên mật khẩu, Sprint 2 nhập/xuất Excel) |
| Low  | Rate limit lưu trong bộ nhớ (một instance)                                                                                | Chuyển Redis store nếu chạy nhiều instance API                                 |
| Low  | Môi trường này có Chromium khác phiên bản Playwright → E2E chạy bằng `PLAYWRIGHT_CHROMIUM_EXECUTABLE`                     | CI tự cài trình duyệt đúng phiên bản                                           |
| Info | Build Docker trong mạng có proxy TLS cần `--secret id=extra_ca,...`                                                       | Đã hỗ trợ tùy chọn trong Dockerfile                                            |

## 9. Rủi ro kỹ thuật

1. **Phiên bản mới**: Next 16, Prisma 7, Tailwind 4, Zod 4 là các major gần đây; đã khóa phiên bản
   chính xác, nâng cấp có kế hoạch (ADR-003).
2. **Ràng buộc SQL viết tay** ngoài tầm Prisma: giảm rủi ro bằng test tích hợp cho từng ràng buộc và
   kiểm tra drift trong CI.
3. **Quyết định nghiệp vụ còn mở** (16 mục) có thể thay đổi thiết kế bảng kho/đơn/hoa hồng; các điểm
   chặn được ghi theo sprint.
4. **Super Admin vs Giám đốc**: thiết kế hiện tách quyền kỹ thuật và quyền nghiệp vụ; nếu doanh nghiệp
   muốn một người kiêm cả hai thì cần gán cả hai vai trò (D-11, D-12).

## 10. Công việc chưa hoàn thành (ngoài phạm vi Sprint 0)

- Xác thực, phiên, MFA, RBAC guard, nhật ký truy cập (Sprint 1).
- Worker BullMQ và xử lý outbox (sprint có thông báo đầu tiên).
- Tích hợp S3 và email trong API.

## 11. Đề xuất Sprint 1 — Authentication & RBAC

Phạm vi: đăng nhập/đăng xuất bằng phiên cookie, quên/đặt lại mật khẩu (email qua Mailpit khi dev),
Argon2id, khóa tài khoản + rate limit đăng nhập, MFA TOTP cho vai trò bắt buộc, thu hồi phiên, nhật ký
truy cập, guard quyền từ chối mặc định + decorator `@RequirePermission`, `AccessContext` lọc phạm vi,
CSRF, lệnh CLI tạo Super Admin đầu tiên, màn hình đăng nhập, quản lý tài khoản nhân viên, ma trận phân
quyền (chặn quyền chỉ-giám-đốc), menu lọc theo quyền, test IDOR và test vượt quyền qua API.
Điều kiện bắt đầu: mục 1.
