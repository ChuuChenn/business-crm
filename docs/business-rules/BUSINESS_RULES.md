# Quy tắc nghiệp vụ

## 1. Quy tắc ĐÃ KHÓA (không được tự ý thay đổi)

Mỗi quy tắc ghi rõ nơi thực thi và kiểm thử. “Sprint N” = sẽ thực thi đầy đủ khi module đó được xây.

### R1 — Giá sàn

| #    | Nội dung                                                                            | Thực thi                                                                                                                | Kiểm thử                                                 |
| ---- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| R1.1 | Nhân viên tự quyết giá nếu giá thực tế ≥ giá sàn                                    | Service xác nhận đơn (Sprint 4), so sánh trên giá **đã snapshot** từ DB, không tin giá sàn từ client                    | Sprint 4                                                 |
| R1.2 | Muốn bán dưới giá sàn: tạo yêu cầu ngoại lệ; đơn bị khóa xác nhận                   | Guard `allLinesAtOrAboveFloor OR priceExceptionApprovedForCurrentVersion` trên `order.CONFIRM`                          | `machines.test.ts` (định nghĩa guard); tích hợp Sprint 4 |
| R1.3 | Chỉ Giám đốc duyệt/từ chối, xem giá sàn, giá đề xuất, lợi nhuận, lý do              | Quyền `price_exception.approve` 🔒                                                                                      | `authz.test.ts`, `schema-constraints.int.test.ts`        |
| R1.4 | Phê duyệt gắn với phiên bản đơn và điều kiện giá; thay đổi liên quan → kiểm tra lại | `price_exceptions.order_version`, `conditions_hash`; sự kiện `INVALIDATE`                                               | Sprint 4: “phê duyệt hết hiệu lực”                       |
| R1.5 | Không bypass bằng API/sửa request                                                   | Server tự tính lại mọi giá trị từ DB trong transaction xác nhận; client chỉ gửi `orderId`, `version`, `Idempotency-Key` | Sprint 4                                                 |

### R2 — Kho

| #    | Nội dung                                                                  | Thực thi                                                                                      |
| ---- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| R2.1 | Nhân viên kho xuất/nhập theo chứng từ nguồn hợp lệ đã duyệt               | Quyền `inventory.document.post` chỉ cho chứng từ `APPROVED` (state machine)                   |
| R2.2 | Chỉ Giám đốc: điều chỉnh tồn, duyệt sửa chứng từ đã ghi sổ, giao dịch đảo | Quyền 🔒 `inventory.adjust`, `inventory.posted_edit.approve`, `inventory.reverse`; trigger DB |
| R2.3 | Không sửa đè chứng từ POSTED                                              | POSTED chỉ có sự kiện `REVERSE`; trigger chặn UPDATE dòng POSTED (Sprint 3)                   |
| R2.4 | Không cho tồn khả dụng âm                                                 | CHECK `qty_on_hand >= 0`, `qty_available >= 0` + khóa dòng (Sprint 3)                         |
| R2.5 | Không xuất trùng serial                                                   | Unique serial theo sản phẩm; serial chỉ ISSUE từ `RESERVED` cho đúng đơn; khóa dòng           |
| R2.6 | Mọi thay đổi tồn có nguồn gốc và audit                                    | `stock_movements` bắt buộc `document_id`; không có API sửa tồn trực tiếp                      |

### R3 — Hoàn tiền

| #    | Nội dung                                    | Thực thi                                                                                    |
| ---- | ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| R3.1 | Chỉ Giám đốc duyệt và thực hiện hoàn tiền   | 🔒 `refund.approve`, `refund.execute`                                                       |
| R3.2 | Nhân viên chỉ tạo yêu cầu                   | `refund.request`                                                                            |
| R3.3 | Không hoàn vượt số còn có thể hoàn          | Khóa dòng đơn + CHECK tổng ở DB; guard `amountNotExceedRefundable` kiểm tra lại lúc EXECUTE |
| R3.4 | Không ghi nhận thành công khi hoàn thất bại | Chỉ trạng thái `SUCCEEDED` làm giảm số đã thu                                               |
| R3.5 | Mọi thao tác có nhật ký                     | `audit_logs` append-only                                                                    |

### R4 — Hoa hồng theo lợi nhuận gộp

- **Lợi nhuận gộp = Doanh thu thuần chưa VAT − Giá vốn tương ứng** — `grossProfit()` trong `@crm/shared/money`.
- **Hoa hồng = MAX(0, Lợi nhuận gộp đủ điều kiện) × Tỷ lệ** — `commissionFromGrossProfit()`.
- Tỷ lệ cấu hình theo nhân viên hoặc nhóm sản phẩm; chia nhiều nhân viên bằng `splitByBps()` (tổng
  các phần luôn bằng số gốc); hoa hồng tạm tính → đủ điều kiện → đã duyệt → đã chi; điều chỉnh khi
  hoàn trả bằng dòng âm; chốt kỳ tháng theo giờ Việt Nam (`businessMonth()`); kỳ đã chốt bất biến;
  chính sách có phiên bản và được snapshot vào đơn lúc xác nhận.
- Kiểm thử công thức: `packages/shared/src/money.test.ts`.

### R5 — Quyền giám đốc

Tập quyền 🔒 chỉ thuộc vai trò `DIRECTOR`. Super Admin (quản trị kỹ thuật) **không** có các quyền này
và không thể tự gán (chặn ở ứng dụng và trigger DB). Danh sách đầy đủ: [PERMISSION_MATRIX.md](../security/PERMISSION_MATRIX.md).

## 2. Quy ước chung

- Tiền VND số nguyên, múi giờ nghiệp vụ `Asia/Ho_Chi_Minh`, giao diện tiếng Việt.
- Không có dữ liệu giả trong database production. Seed chỉ gồm dữ liệu tham chiếu (danh mục quyền,
  vai trò hệ thống). Cửa hàng, kho, nhân viên, sản phẩm do người dùng nhập.
- Không hardcode giá bán, tỷ lệ hoa hồng, giá sàn, quyền truy cập: tất cả nằm trong bảng cấu hình có
  phiên bản và audit.

## 3. Giả định đang dùng

Chỉ giả định ở phần có thể đổi an toàn bằng cấu hình. Các điểm ảnh hưởng tiền, kho, quyền, pháp lý
nằm trong [OPEN_DECISIONS.md](./OPEN_DECISIONS.md) và **chưa** được triển khai cho đến khi có quyết định.

| Giả định                                                                                                                    | Ảnh hưởng  | Thay đổi được bằng             |
| --------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------ |
| Thời hạn phiên đăng nhập 12 giờ, hết hạn sau 30 phút không hoạt động                                                        | Thấp       | `system_settings`              |
| Khóa tài khoản 15 phút sau 5 lần đăng nhập sai                                                                              | Thấp       | `system_settings`              |
| Ngưỡng cảnh báo tồn thấp theo từng sản phẩm, mặc định 0 (không cảnh báo)                                                    | Thấp       | Cấu hình sản phẩm              |
| Lead quá hạn: không có hoạt động sau 3 ngày                                                                                 | Thấp       | `system_settings`              |
| Danh mục vai trò mặc định theo [PERMISSION_MATRIX.md](../security/PERMISSION_MATRIX.md) (trừ các điểm trong OPEN_DECISIONS) | Trung bình | Màn hình phân quyền (Sprint 1) |
