# Business CRM

Hệ thống CRM + POS + Kho + Quản lý nhân sự + Tài chính cho doanh nghiệp bán lẻ B2C Việt Nam
(tiếng Việt, VND, múi giờ `Asia/Ho_Chi_Minh`). Kiến trúc modular monolith, sẵn sàng mở rộng nhiều cửa hàng.

**Trạng thái:** Sprint 0 — Nền tảng & Kiến trúc. Xem [báo cáo Sprint 0](docs/reports/SPRINT_0_REPORT.md).

## Công nghệ

| Lớp      | Công nghệ                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| Web      | Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, shadcn/ui, TanStack Query, React Hook Form + Zod |
| API      | NestJS 11, REST, OpenAPI 3.1, Prisma 7 (adapter `pg`), pino                                                  |
| Dữ liệu  | PostgreSQL 16, Redis 7, S3-compatible (RustFS khi dev)                                                       |
| Hạ tầng  | Docker Compose, Caddy (reverse proxy, HTTPS), GitHub Actions                                                 |
| Kiểm thử | Vitest, Supertest, Playwright, PostgreSQL thật                                                               |

## Yêu cầu

Node.js ≥ 22.12, pnpm 10 (`corepack enable`), Docker + Docker Compose.

## Chạy môi trường phát triển

```bash
cp .env.example .env            # rồi đổi mọi giá trị change-me
corepack enable && pnpm install
pnpm infra:up                   # PostgreSQL, Redis, RustFS (S3), Mailpit
pnpm db:migrate                 # áp dụng migration
pnpm build                      # build shared + api + web
pnpm db:seed                    # dữ liệu tham chiếu: danh mục quyền, vai trò hệ thống (không tạo user)
pnpm dev                        # API http://localhost:4000, Web http://localhost:3000
```

- Swagger UI: http://localhost:4000/api/docs · OpenAPI JSON: http://localhost:4000/api/openapi.json
- Health: `GET /api/v1/health` (liveness), `GET /api/v1/health/ready` (PostgreSQL + Redis)
- Mailpit (email dev): http://localhost:8025 · RustFS (S3) console: http://localhost:9001

Chạy toàn bộ stack trong Docker sau reverse proxy (http://localhost:8080):

```bash
APP_NODE_ENV=test docker compose --profile app up -d --build   # dev: cho phép mật khẩu dev
```

Ở production, API từ chối khởi động nếu `.env` còn mật khẩu mẫu.

## Lệnh thường dùng

| Lệnh                                                 | Mô tả                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm lint` / `pnpm typecheck` / `pnpm format:check` | Kiểm tra tĩnh toàn repo                                    |
| `pnpm test`                                          | Unit test                                                  |
| `pnpm test:integration`                              | Test tích hợp trên PostgreSQL + Redis thật (DB `crm_test`) |
| `pnpm test:e2e`                                      | Playwright trên bản build production                       |
| `pnpm build`                                         | Build production                                           |
| `pnpm db:migrate:dev`                                | Tạo migration mới (dev)                                    |
| `pnpm docs:generate`                                 | Sinh lại ma trận quyền và sơ đồ trạng thái từ mã nguồn     |
| `infrastructure/scripts/backup.sh` / `restore.sh`    | Sao lưu / khôi phục (chỉ vào database mới)                 |

## Cấu trúc

```
apps/web          Giao diện Next.js
apps/api          API NestJS + Prisma (schema, migrations)
packages/shared   Quy tắc nghiệp vụ dùng chung: quyền, state machine, tiền VND, múi giờ, schema
packages/ui       Thành phần shadcn/ui
packages/config   tsconfig, ESLint dùng chung
tests/e2e         Playwright
infrastructure    Dockerfile, Caddy, script
docs              Tài liệu
```

## Tài liệu

- Kiến trúc: [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md), [DECISIONS.md](docs/architecture/DECISIONS.md), [STATE_MACHINES.md](docs/architecture/STATE_MACHINES.md)
- Nghiệp vụ: [BUSINESS_RULES.md](docs/business-rules/BUSINESS_RULES.md), [OPEN_DECISIONS.md](docs/business-rules/OPEN_DECISIONS.md)
- Database: [ERD.md](docs/database/ERD.md)
- API: [API_CONVENTIONS.md](docs/api/API_CONVENTIONS.md), [openapi.json](docs/api/openapi.json)
- Bảo mật: [SECURITY.md](docs/security/SECURITY.md), [PERMISSION_MATRIX.md](docs/security/PERMISSION_MATRIX.md)
- Kiểm thử: [TEST_STRATEGY.md](docs/testing/TEST_STRATEGY.md)
- Hướng dẫn cho AI agent / người đóng góp: [AGENTS.md](AGENTS.md)
