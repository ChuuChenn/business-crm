# Quyết định kiến trúc (ADR)

Mỗi quyết định ghi bối cảnh, lựa chọn, lý do và rủi ro. Thay đổi một quyết định phải thêm ADR mới
(không sửa ADR cũ) và giải thích lợi ích/rủi ro trước khi thực hiện (đặc tả §3).

## ADR-001 — Modular monolith, một API NestJS

- **Quyết định**: một tiến trình API NestJS chia module theo nghiệp vụ; worker nền chạy cùng codebase.
- **Lý do**: 6–15 người dùng, nghiệp vụ tiền–kho–hoa hồng ràng buộc chặt cần transaction ACID trên
  một database. Microservices sẽ buộc dùng saga/eventual consistency cho đúng những chỗ cần nhất quán mạnh.
- **Rủi ro**: module dính nhau → giảm bằng quy ước chỉ gọi qua service export, không truy vấn chéo bảng.

## ADR-002 — Prisma ORM 7 + driver adapter `pg`, ràng buộc nâng cao bằng SQL

- **Quyết định**: Prisma cho truy vấn kiểu an toàn và migration có kiểm soát; CHECK, trigger, index
  partial/biểu thức viết tay trong file migration SQL; Prisma `$queryRaw` (tham số hóa) cho truy vấn
  khóa dòng (`FOR UPDATE`).
- **Lý do**: đặc tả ưu tiên Prisma; Prisma 7 bỏ engine Rust (dùng adapter `pg`), nhẹ hơn khi build image.
- **Rủi ro**: Prisma không biểu diễn được mọi ràng buộc → mọi ràng buộc SQL viết tay phải có kiểm thử
  tích hợp, và CI chạy `prisma migrate diff --exit-code` để phát hiện drift.
  Ví dụ đã gặp ở Sprint 0: index `NULLS NOT DISTINCT` bị Prisma coi là drift → thay bằng hai index partial
  (migration `20261019173000_user_roles_partial_unique`).

## ADR-003 — Phiên bản thư viện

Chọn bản ổn định đã kiểm chứng thay vì bản major vừa phát hành:

| Thành phần | Chọn   | Bản mới nhất lúc khởi tạo    | Lý do                              |
| ---------- | ------ | ---------------------------- | ---------------------------------- |
| NestJS     | 11.2.7 | 12.2.0 (phát hành cùng ngày) | 12.x quá mới; 11.x vẫn được vá     |
| Prisma     | 7.10.1 | 8.0.0-rc                     | Không dùng bản RC cho tiền/kho     |
| TypeScript | 5.9.3  | 7.0.2                        | typescript-eslint chỉ hỗ trợ < 6.1 |
| ESLint     | 9.39   | 10.x                         | eslint-config-next ổn định trên 9  |
| Next.js    | 16.4.2 | 16.4.2                       | Bản ổn định hiện hành              |

Nâng cấp major được lên kế hoạch như một hạng mục riêng có kiểm thử hồi quy.

## ADR-004 — Tiền là số nguyên đồng (BIGINT), tỷ lệ là basis point

- `BIGINT` VND (VND không có đơn vị lẻ), `bigint` trong TypeScript, chuỗi trong JSON.
- Thuế suất, tỷ lệ hoa hồng, chiết khấu %: `INT` basis point (1% = 100).
- Mọi phép chia phải truyền chế độ làm tròn tường minh; chế độ làm tròn cho VAT và hoa hồng là quyết
  định nghiệp vụ (OPEN_DECISIONS D-01).

## ADR-005 — Phiên server-side bằng cookie, không JWT

- Cho phép thu hồi phiên tức thì (yêu cầu “thu hồi phiên”, “khóa tài khoản”), đơn giản cho một web app
  cùng origin. Đi kèm CSRF token + `SameSite=Lax`.

## ADR-006 — Quy tắc nghiệp vụ dùng chung trong `@crm/shared`

- Danh mục quyền, ma trận mặc định, state machine, công thức tiền là TypeScript thuần, có unit test,
  dùng cho cả API (kiểm tra thật) và web (ẩn/hiện, validate sớm). Tài liệu ma trận quyền và sơ đồ
  trạng thái **sinh từ mã nguồn**; CI chặn tài liệu lệch.

## ADR-007 — Proxy `/api` cùng origin trong Next.js

- Next.js `rewrites` bị đóng băng địa chỉ đích lúc build → không dùng được cho image chạy nhiều môi
  trường. Dùng route handler `app/api/[...path]` đọc `API_INTERNAL_URL` lúc chạy, chỉ chuyển tiếp
  danh sách header cho phép. Production đặt Caddy định tuyến `/api/*` thẳng tới API.

## ADR-008 — Kiểm thử tích hợp trên PostgreSQL thật

- Không mock database cho nghiệp vụ tiền, kho, quyền (đặc tả §9). Test tích hợp chạy trên DB tên
  `*_test` (hàng rào trong `global-setup.ts` từ chối DB khác), dựng lại schema bằng migration thật.
