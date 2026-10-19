# Hướng dẫn cho AI agent và người đóng góp

Đọc trước: [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) và
[docs/business-rules/BUSINESS_RULES.md](docs/business-rules/BUSINESS_RULES.md).

## Quy tắc bắt buộc

1. **Không thay đổi quy tắc đã khóa** (giá sàn, kho, hoàn tiền, hoa hồng theo lợi nhuận gộp, quyền
   giám đốc). Thiếu quyết định ảnh hưởng tiền/kho/quyền/pháp lý → ghi vào
   `docs/business-rules/OPEN_DECISIONS.md` và hỏi chủ dự án, không tự giả định.
2. **Tiền**: chỉ `bigint` / `BIGINT` đồng VND, tỷ lệ basis point, làm tròn tường minh qua
   `@crm/shared` (`applyBps`, `netFromGross`, `commissionFromGrossProfit`, `splitByBps`). Cấm `number`
   float cho tiền.
3. **Quyền**: kiểm tra ở backend cho mọi endpoint; lọc phạm vi dữ liệu trong truy vấn (chống IDOR).
   Thêm quyền mới vào `packages/shared/src/authz/permissions.ts` + ma trận mặc định, rồi `pnpm docs:generate`.
4. **Trạng thái**: chỉ đổi qua `assertTransition` của state machine trong `@crm/shared`; không có API
   đặt trạng thái tùy ý. Chứng từ POSTED, kỳ hoa hồng CLOSED, log audit là bất biến.
5. **Database**: mọi thay đổi qua migration mới (`pnpm db:migrate:dev`), không sửa migration đã áp
   dụng. Ràng buộc SQL viết tay phải có test tích hợp. CI chặn drift Prisma.
6. **Không reset/xóa database có dữ liệu thật**, không đẩy production, không thực hiện giao dịch tiền thật.
7. **Không dữ liệu giả trong production**. Seed chỉ chứa dữ liệu tham chiếu; không tạo tài khoản mặc định.
8. **Không log** mật khẩu, token, cookie, bí mật MFA, dữ liệu cá nhân thừa.
9. Giao diện: tiếng Việt; mọi nút phải có hành vi thật hoặc hiển thị rõ “chưa triển khai”.
10. **Định nghĩa hoàn thành**: lint + typecheck + unit + integration (DB thật) + E2E (nếu có UI) + build
    đều đạt, và ghi kết quả thực tế vào `docs/reports/SPRINT_N_REPORT.md`. Không báo GO khi còn lỗi
    Critical/High.

## Lệnh

```bash
pnpm install && pnpm infra:up && pnpm db:migrate && pnpm build
pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm test:e2e
```

## Quy ước mã

- NestJS: không dùng `import type` cho class được inject trong constructor (làm hỏng DI).
- Module API: `src/modules/<module>/{*.controller,*.service,*.module}.ts`; truy vấn Prisma chỉ trong service/repository.
- Web: component dùng chung đặt ở `packages/ui`; gọi API qua `src/lib/api-client.ts` + TanStack Query, validate bằng schema `@crm/shared`.
- Test tích hợp đặt ở `apps/api/test/integration/*.int.test.ts`, chỉ chạy trên database `*_test`.
- Commit/PR: tiêu đề tiếng Anh theo Conventional Commits; mô tả có thể tiếng Việt.
