# State machine nghiệp vụ

Định nghĩa thực thi: `packages/shared/src/state-machines/machines.ts`.
Sơ đồ và bảng chuyển trạng thái đầy đủ (sinh tự động): [STATE_MACHINES.generated.md](./STATE_MACHINES.generated.md).

## Nguyên tắc chung

1. **Một nguồn sự thật**: service backend gọi `assertTransition(machine, from, event)` trước khi ghi
   trạng thái mới. Không có endpoint “đặt trạng thái tùy ý” (`PATCH status`).
2. **Ghi trạng thái có điều kiện**: `UPDATE … SET status = :to, version = version + 1 WHERE id = :id
AND status = :from AND version = :expected` trong transaction; 0 dòng → `409`. Chặn hai người cùng
   chuyển trạng thái.
3. **Guard** liệt kê trong định nghĩa là điều kiện nghiệp vụ service bắt buộc kiểm tra trong cùng
   transaction; mỗi guard có kiểm thử tích hợp ở sprint triển khai module.
4. **Trạng thái kết thúc bất biến**. Sửa sai bằng chứng từ/giao dịch mới (đảo, điều chỉnh), không sửa đè.
5. Mỗi chuyển trạng thái ghi `audit_logs` (trước/sau, người thực hiện, lý do) và, nếu cần thông báo,
   một `outbox_events` trong cùng transaction.

## Các máy trạng thái

| Máy                                 | Trạng thái                                                                   | Điểm then chốt                                                                                                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Đơn hàng (`order`)                  | DRAFT → CONFIRMED → ISSUED → (DELIVERING) → DELIVERED → COMPLETED; CANCELLED | Xác nhận = snapshot giá, giá vốn, thuế, chiết khấu, chính sách hoa hồng + giữ tồn. Thanh toán theo dõi riêng (`payment_status` dẫn xuất). Đơn đã xuất kho không hủy được; đi qua trả hàng.                   |
| Ngoại lệ giá sàn (`priceException`) | PENDING → APPROVED → CONSUMED; REJECTED, CANCELLED, INVALIDATED, EXPIRED     | Gắn `order_id + order_version + conditions_hash` (dòng, giá, số lượng, giá sàn, giá vốn). Bất kỳ thay đổi nào → INVALIDATED. CONSUME chỉ xảy ra trong transaction xác nhận đơn. Người duyệt ≠ người yêu cầu. |
| Chứng từ kho (`inventoryDocument`)  | DRAFT → PENDING_APPROVAL → APPROVED → POSTED → (REVERSED)                    | POSTED bất biến. Phiếu xuất sinh từ đơn đã xác nhận được AUTO_APPROVE (chứng từ nguồn hợp lệ). Chứng từ điều chỉnh tồn chỉ Giám đốc duyệt. REVERSE tạo chứng từ đảo.                                         |
| Hàng có serial (`stockUnit`)        | AVAILABLE ⇄ RESERVED → SOLD → …                                              | Serial chỉ ISSUE được từ RESERVED cho đúng đơn → chặn xuất trùng serial. Tình trạng (mới/đã qua sử dụng) là thuộc tính, không phải trạng thái.                                                               |
| Thanh toán (`payment`)              | PENDING → SUCCEEDED; FAILED, CANCELLED; SUCCEEDED → VOIDED                   | VOID là hủy ghi nhận sai, khác hoàn tiền; cần lý do.                                                                                                                                                         |
| Hoàn tiền (`refund`)                | REQUESTED → APPROVED → PROCESSING → SUCCEEDED / FAILED                       | Chỉ Giám đốc APPROVE/EXECUTE. Chỉ SUCCEEDED mới giảm số đã thu. FAILED không bao giờ ghi nhận thành công; có thể thử lại.                                                                                    |
| Hoa hồng (`commission`)             | PROVISIONAL → ELIGIBLE → APPROVED → PAID; VOID                               | Điều chỉnh khi trả hàng = dòng hoa hồng âm mới, không sửa dòng cũ.                                                                                                                                           |
| Kỳ hoa hồng (`commissionPeriod`)    | OPEN → CLOSED                                                                | CLOSED bất biến; điều chỉnh sau chốt vào kỳ mở kế tiếp.                                                                                                                                                      |
| Lead (`lead`)                       | NEW → ASSIGNED → CONTACTED → QUALIFIED → QUOTED → NEGOTIATING → WON / LOST   | Đúng chuỗi trạng thái đặc tả; LOST bắt buộc lý do; có thể REOPEN (quyền `lead.reopen`).                                                                                                                      |
| Công việc (`task`)                  | TODO → IN_PROGRESS ⇄ BLOCKED → DONE; CANCELLED                               | Quá hạn là thuộc tính tính từ deadline, không phải trạng thái.                                                                                                                                               |

## Trả hàng / đổi hàng

Không thêm trạng thái vào đơn gốc. Trả/đổi là chứng từ riêng (`order_returns`, Sprint 4) tham chiếu
dòng đơn gốc: yêu cầu → duyệt → nhận hàng (phiếu nhập trả, serial → `RETURNED_PENDING_INSPECTION`)
→ hoàn tiền (máy `refund`) và/hoặc đơn mới (đổi hàng). Hoa hồng điều chỉnh bằng dòng âm.
