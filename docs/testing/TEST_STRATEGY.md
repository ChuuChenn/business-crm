# Chiến lược kiểm thử

| Tầng        | Công cụ                                                 | Phạm vi                                                                                                         | Lệnh                                               |
| ----------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Unit        | Vitest                                                  | Quy tắc thuần (`@crm/shared`: tiền, quyền, state machine), cấu hình, filter lỗi, log redaction, component React | `pnpm test`                                        |
| Integration | Vitest + Supertest + **PostgreSQL & Redis thật**        | API HTTP end-to-end trong tiến trình, ràng buộc/trigger DB, seed, (từ Sprint 1) mọi nghiệp vụ tiền, kho, quyền  | `pnpm test:integration`                            |
| E2E         | Playwright (desktop + điện thoại)                       | Bản build production web + API + DB thật                                                                        | `pnpm test:e2e`                                    |
| Tĩnh        | ESLint, `tsc --noEmit`, Prettier, `prisma migrate diff` | Toàn repo                                                                                                       | `pnpm lint`, `pnpm typecheck`, `pnpm format:check` |

## Quy tắc

1. **Không mock database** cho nghiệp vụ tiền, kho, quyền (đặc tả §9). Mock chỉ dùng cho hiển thị UI
   và dịch vụ bên ngoài.
2. Test tích hợp chỉ chạy trên database tên `*_test` (hàng rào trong `apps/api/test/integration/global-setup.ts`);
   schema dựng lại từ migration thật mỗi lần chạy.
3. Mỗi quy tắc đã khóa phải có test chứng minh **không bypass được qua API**, không chỉ qua UI.
4. Kiểm thử đồng thời dùng nhiều kết nối DB thật chạy song song (`Promise.all`) và kiểm tra bất biến
   sau cùng (tồn không âm, tổng hoàn ≤ đã thu, mỗi serial xuất một lần).
5. Báo cáo sprint ghi chính xác lệnh đã chạy và kết quả; không báo hoàn thành khi chưa chạy.

## Ma trận kiểm thử bắt buộc (đặc tả §9)

| Tình huống                                                    | Sprint | Loại test             |
| ------------------------------------------------------------- | ------ | --------------------- |
| Giá dưới sàn không xác nhận được nếu chưa có phê duyệt hợp lệ | 4      | Integration (API)     |
| Phê duyệt hết hiệu lực khi đơn đổi phiên bản / hết hạn        | 4      | Integration           |
| Hai người xuất cùng serial                                    | 3      | Integration đồng thời |
| Xuất kho đồng thời làm tồn âm                                 | 3      | Integration đồng thời |
| Hoàn tiền trùng (cùng Idempotency-Key, hai request song song) | 4      | Integration đồng thời |
| Thanh toán trùng                                              | 4      | Integration đồng thời |
| Sửa đơn đồng thời (optimistic lock)                           | 4      | Integration           |
| Điều chỉnh tồn trái quyền (kể cả qua API trực tiếp)           | 3      | Integration           |
| Hoa hồng khi hoàn trả (dòng âm, kỳ đã chốt không đổi)         | 5      | Unit + Integration    |
| Nhân viên truy cập dữ liệu không được giao (IDOR)             | 1–2    | Integration           |

Đã có ở Sprint 0: công thức hoa hồng/lợi nhuận gộp, quyền chỉ-giám-đốc ở cả ứng dụng và trigger DB,
log append-only, bất biến state machine (trạng thái kết thúc, tất định, khả đạt).

## Chạy cục bộ

```bash
pnpm infra:up                 # PostgreSQL + Redis (+ RustFS, Mailpit)
pnpm build
pnpm test                     # unit
pnpm test:integration         # cần TEST_DATABASE_URL (…/crm_test)
pnpm db:migrate && pnpm db:seed
pnpm test:e2e                 # tự khởi động API (cổng 4100) và web (cổng 3100)
```

Trong môi trường đã có sẵn Chromium khác phiên bản Playwright, đặt
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/đường/dẫn/chrome`.
