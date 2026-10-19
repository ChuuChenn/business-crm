# Bảo mật

Bảng dưới theo yêu cầu bắt buộc của đặc tả §6. “Đã có” nghĩa là đã triển khai **và** có kiểm thử.

| Yêu cầu                     | Thiết kế                                                                                                                                                   | Trạng thái                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Hash mật khẩu an toàn       | Argon2id (tham số OWASP), đổi mật khẩu thu hồi các phiên khác                                                                                              | Sprint 1 (cột `password_hash` + CHECK đã có)                   |
| MFA quản trị                | TOTP; bí mật mã hóa AES-256-GCM; vai trò bắt buộc theo D-07                                                                                                | Sprint 1 (cột + CHECK đã có)                                   |
| Quản lý phiên               | Cookie HttpOnly/Secure/SameSite; DB chỉ lưu SHA-256 token; hết hạn tuyệt đối + nhàn rỗi; thu hồi                                                           | Sprint 1 (bảng + CHECK đã có, có test)                         |
| Rate limiting               | `@nestjs/throttler` toàn cục (mặc định 300 req/phút/IP, cấu hình được); giới hạn chặt hơn cho đăng nhập/quên mật khẩu; Redis store khi chạy nhiều instance | **Đã có** (toàn cục); chặt cho auth ở Sprint 1                 |
| Validate input              | Zod tại controller, schema dùng chung; giới hạn body 1 MB                                                                                                  | Khung đã có; áp dụng theo từng API                             |
| Phân quyền mọi API          | Guard toàn cục từ chối mặc định; decorator khai báo quyền                                                                                                  | Sprint 1                                                       |
| Chống IDOR                  | Lọc phạm vi OWN/TEAM/STORE/ORG trong repository; ngoài phạm vi → 404                                                                                       | Sprint 1–2 + test “nhân viên truy cập dữ liệu không được giao” |
| Chống SQL injection         | Prisma (tham số hóa); `$queryRaw` dạng tagged template; cấm `$queryRawUnsafe` với dữ liệu người dùng (lint rule Sprint 1)                                  | Đã có ở mức thư viện                                           |
| CSRF                        | Double-submit token + kiểm tra `Origin`; `SameSite=Lax`                                                                                                    | Sprint 1                                                       |
| Audit log                   | `audit_logs` append-only, trigger chặn UPDATE/DELETE/TRUNCATE                                                                                              | **Đã có** (có test)                                            |
| Không log dữ liệu nhạy cảm  | pino redact: authorization, cookie, set-cookie, password, token, mfaSecret, otp; bỏ query string khỏi URL log                                              | **Đã có** (có test)                                            |
| Không float cho tiền        | `bigint`/`BIGINT`, làm tròn tường minh                                                                                                                     | **Đã có** (thư viện + test)                                    |
| Transaction tiền/kho        | Xem ARCHITECTURE §5                                                                                                                                        | Sprint 3–4                                                     |
| Concurrency                 | Optimistic lock (`version`), khóa dòng, idempotency                                                                                                        | Bảng `idempotency_keys` đã có; áp dụng Sprint 3–4              |
| Backup/restore              | `infrastructure/scripts/backup.sh` / `restore.sh` (pg_dump định dạng custom)                                                                               | **Đã có** (đã thử backup + restore sang DB khác)               |
| Secrets qua biến môi trường | `.env` không commit; API kiểm tra cấu hình bằng Zod, từ chối production nếu còn mật khẩu mẫu, không in giá trị                                             | **Đã có** (có test)                                            |
| Không admin mặc định        | Seed không tạo người dùng; Super Admin đầu tiên tạo bằng CLI                                                                                               | **Đã có** (test xác nhận 0 user sau seed)                      |
| Header bảo mật              | helmet (API), header Next.js, Caddy; ẩn `x-powered-by`                                                                                                     | **Đã có** (có test)                                            |
| CORS                        | Danh sách origin cho phép; trình duyệt dùng proxy cùng origin                                                                                              | **Đã có** (có test)                                            |
| Quyền chỉ-giám-đốc          | 3 lớp: `validateGrant`, trigger DB, test                                                                                                                   | **Đã có**                                                      |

## Mô hình đe dọa ưu tiên

1. **Nhân viên nội bộ vượt quyền** (sửa request để bán dưới giá sàn, xem khách không được giao, tự
   hoàn tiền): server tính lại mọi giá trị, quyền kiểm tra ở backend + DB, audit append-only.
2. **Thao tác trùng/đồng thời** gây sai tiền/kho: idempotency + khóa dòng + ràng buộc DB.
3. **Chiếm tài khoản quản trị**: MFA, khóa tài khoản, rate limit, thu hồi phiên, nhật ký truy cập.
4. **Lộ dữ liệu cá nhân khách hàng** (Nghị định 13/2023): xuất Excel là quyền nhạy cảm có audit,
   lưu đồng ý tiếp thị, mã hóa kết nối, không log dữ liệu cá nhân thừa.

## Vận hành

- Bản vá phụ thuộc: chạy `pnpm audit --prod` trong CI từ Sprint 1, review hằng tháng.
- Sao lưu: hằng ngày, giữ 30 ngày, thử khôi phục hằng tháng vào DB riêng (không đè DB thật).
