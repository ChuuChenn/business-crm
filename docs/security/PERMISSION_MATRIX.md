<!-- TỆP SINH TỰ ĐỘNG từ packages/shared — không sửa tay. Chạy `pnpm docs:generate`. -->

# Ma trận phân quyền mặc định

Giá trị ô: `✔` = có quyền (toàn tổ chức hoặc quyền không phân phạm vi); `Của mình` / `Nhóm` / `Cửa hàng` = phạm vi dữ liệu; trống = không có quyền.

🔒 = **quyền chỉ dành cho Giám đốc (quy tắc đã khóa)** — không thể gán cho vai trò khác, kể cả bởi Super Admin; được chặn ở 3 lớp: `validateGrant` (ứng dụng), trigger `crm_check_role_permission` (database), kiểm thử tích hợp.
⚠️ = quyền nhạy cảm: bắt buộc ghi audit log.

Đây là dữ liệu khởi tạo; tại runtime backend đọc ma trận từ bảng `role_permissions`.

| Vai trò              | Mã                 |
| -------------------- | ------------------ |
| Quản trị hệ thống    | `SUPER_ADMIN`      |
| Giám đốc             | `DIRECTOR`         |
| Trưởng nhóm          | `TEAM_LEAD`        |
| Nhân viên kinh doanh | `SALES`            |
| Chăm sóc khách hàng  | `CUSTOMER_SERVICE` |
| Nhân viên kho        | `WAREHOUSE`        |
| Kế toán              | `ACCOUNTANT`       |

## Module `system`

| Quyền                       | Mô tả                                            | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| --------------------------- | ------------------------------------------------ | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `system.settings.manage` ⚠️ | Cấu hình hệ thống                                |         ✔         |          |             |                      |                     |               |         |
| `user.read`                 | Xem tài khoản nhân viên                          |         ✔         |    ✔     |             |                      |                     |               |         |
| `user.manage` ⚠️            | Tạo/sửa tài khoản nhân viên                      |         ✔         |    ✔     |             |                      |                     |               |         |
| `user.lock` ⚠️              | Khóa/mở khóa tài khoản                           |         ✔         |    ✔     |             |                      |                     |               |         |
| `user.session.revoke` ⚠️    | Thu hồi phiên đăng nhập                          |         ✔         |    ✔     |             |                      |                     |               |         |
| `role.read`                 | Xem vai trò và ma trận quyền                     |         ✔         |    ✔     |             |                      |                     |               |         |
| `role.manage` ⚠️            | Gán quyền cho vai trò, gán vai trò cho nhân viên |         ✔         |          |             |                      |                     |               |         |
| `audit.read`                | Xem nhật ký hành động và nhật ký truy cập        |         ✔         |    ✔     |             |                      |                     |               |         |

## Module `customer`

| Quyền                     | Mô tả                              | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| ------------------------- | ---------------------------------- | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `customer.read`           | Xem khách hàng                     |                   |    ✔     |    Nhóm     |       Của mình       |      Cửa hàng       |               |    ✔    |
| `customer.create`         | Tạo khách hàng                     |                   |    ✔     |      ✔      |          ✔           |          ✔          |               |         |
| `customer.update`         | Sửa khách hàng                     |                   |    ✔     |    Nhóm     |       Của mình       |      Cửa hàng       |               |         |
| `customer.assign`         | Phân công / chuyển giao khách hàng |                   |    ✔     |    Nhóm     |                      |                     |               |         |
| `customer.merge` ⚠️       | Gộp khách hàng trùng               |                   |    ✔     |    Nhóm     |                      |                     |               |         |
| `customer.import` ⚠️      | Nhập khách hàng từ Excel           |                   |    ✔     |             |                      |                     |               |         |
| `customer.export` ⚠️      | Xuất khách hàng ra Excel           |                   |    ✔     |    Nhóm     |                      |                     |               |         |
| `customer.consent.update` | Cập nhật đồng ý liên hệ tiếp thị   |                   |    ✔     |    Nhóm     |       Của mình       |      Cửa hàng       |               |         |
| `care.log`                | Ghi lịch sử chăm sóc               |                   |    ✔     |    Nhóm     |       Của mình       |      Cửa hàng       |               |         |

## Module `lead`

| Quyền         | Mô tả                              | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| ------------- | ---------------------------------- | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `lead.read`   | Xem lead                           |                   |    ✔     |    Nhóm     |       Của mình       |      Của mình       |               |         |
| `lead.create` | Tạo lead                           |                   |    ✔     |      ✔      |          ✔           |          ✔          |               |         |
| `lead.update` | Cập nhật lead và chuyển trạng thái |                   |    ✔     |    Nhóm     |       Của mình       |      Của mình       |               |         |
| `lead.assign` | Phân công lead                     |                   |    ✔     |    Nhóm     |                      |                     |               |         |
| `lead.reopen` | Mở lại lead đã đóng                |                   |    ✔     |    Nhóm     |                      |                     |               |         |

## Module `task`

| Quyền             | Mô tả                         | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán  |
| ----------------- | ----------------------------- | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :------: |
| `task.read`       | Xem công việc                 |                   |    ✔     |    Nhóm     |       Của mình       |      Của mình       |   Của mình    | Của mình |
| `task.create`     | Tạo và giao việc              |                   |    ✔     |    Nhóm     |                      |                     |               |          |
| `task.update`     | Cập nhật trạng thái công việc |                   |    ✔     |    Nhóm     |       Của mình       |      Của mình       |   Của mình    | Của mình |
| `task.handover`   | Bàn giao công việc            |                   |    ✔     |    Nhóm     |                      |                     |               |          |
| `schedule.read`   | Xem lịch làm việc             |                   |    ✔     |    Nhóm     |       Của mình       |      Của mình       |   Của mình    | Của mình |
| `schedule.manage` | Xếp lịch làm việc             |                   |    ✔     |    Nhóm     |                      |                     |               |          |

## Module `employee`

| Quyền                | Mô tả                         | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán  |
| -------------------- | ----------------------------- | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :------: |
| `employee.read`      | Xem hồ sơ nhân viên           |                   |    ✔     |    Nhóm     |                      |                     |               |          |
| `employee.manage` ⚠️ | Quản lý hồ sơ nhân viên, nhóm |                   |    ✔     |             |                      |                     |               |          |
| `kpi.read`           | Xem KPI                       |                   |    ✔     |    Nhóm     |       Của mình       |      Của mình       |   Của mình    | Của mình |
| `kpi.manage`         | Đặt chỉ tiêu KPI              |                   |    ✔     |    Nhóm     |                      |                     |               |          |
| `performance.review` | Đánh giá hiệu suất            |                   |    ✔     |    Nhóm     |                      |                     |               |          |

## Module `product`

| Quyền                           | Mô tả                                   | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| ------------------------------- | --------------------------------------- | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `product.read`                  | Xem sản phẩm và giá bán                 |                   |    ✔     |      ✔      |          ✔           |          ✔          |       ✔       |    ✔    |
| `product.manage`                | Tạo/sửa sản phẩm, danh mục, biến thể    |                   |    ✔     |             |                      |                     |               |         |
| `product.cost.read` ⚠️          | Xem giá vốn                             |                   |    ✔     |      ✔      |                      |                     |               |    ✔    |
| `product.price.manage` ⚠️       | Đặt giá bán đề xuất, giá sàn, thuế suất |                   |    ✔     |             |                      |                     |               |         |
| `price_exception.request`       | Tạo yêu cầu bán dưới giá sàn            |                   |    ✔     |    Nhóm     |       Của mình       |                     |               |         |
| `price_exception.approve` 🔒 ⚠️ | Phê duyệt/từ chối bán dưới giá sàn      |                   |    ✔     |             |                      |                     |               |         |

## Module `inventory`

| Quyền                                 | Mô tả                                            | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| ------------------------------------- | ------------------------------------------------ | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `inventory.read`                      | Xem tồn kho và lịch sử biến động                 |                   |    ✔     |      ✔      |          ✔           |          ✔          |       ✔       |    ✔    |
| `inventory.document.create`           | Lập chứng từ kho nháp                            |                   |    ✔     |             |                      |                     |       ✔       |         |
| `inventory.document.approve` ⚠️       | Duyệt chứng từ kho                               |                   |    ✔     |             |                      |                     |               |         |
| `inventory.document.post`             | Ghi sổ chứng từ kho đã duyệt (xuất/nhập thực tế) |                   |    ✔     |             |                      |                     |       ✔       |         |
| `inventory.stocktake.count`           | Thực hiện kiểm kê                                |                   |    ✔     |             |                      |                     |       ✔       |         |
| `inventory.adjust` 🔒 ⚠️              | Điều chỉnh tồn kho                               |                   |    ✔     |             |                      |                     |               |         |
| `inventory.posted_edit.approve` 🔒 ⚠️ | Phê duyệt sửa chứng từ đã ghi sổ                 |                   |    ✔     |             |                      |                     |               |         |
| `inventory.reverse` 🔒 ⚠️             | Giao dịch đảo / điều chỉnh sửa sai               |                   |    ✔     |             |                      |                     |               |         |
| `inventory.status.change`             | Chuyển trạng thái hàng (lỗi, bảo hành, trả lại)  |                   |    ✔     |             |                      |                     |       ✔       |         |

## Module `order`

| Quyền                     | Mô tả                                | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| ------------------------- | ------------------------------------ | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `order.read`              | Xem đơn hàng                         |                   |    ✔     |    Nhóm     |       Của mình       |      Cửa hàng       |   Cửa hàng    |    ✔    |
| `order.create`            | Tạo đơn hàng                         |                   |    ✔     |      ✔      |          ✔           |                     |               |         |
| `order.update`            | Sửa đơn nháp                         |                   |    ✔     |    Nhóm     |       Của mình       |                     |               |         |
| `order.confirm`           | Xác nhận đơn                         |                   |    ✔     |    Nhóm     |       Của mình       |                     |               |         |
| `order.cancel` ⚠️         | Hủy đơn                              |                   |    ✔     |    Nhóm     |       Của mình       |                     |               |         |
| `order.fulfill`           | Xuất hàng / giao hàng / hoàn tất đơn |                   |    ✔     |    Nhóm     |       Của mình       |                     |   Cửa hàng    |         |
| `order.return.request`    | Tạo yêu cầu trả/đổi hàng             |                   |    ✔     |    Nhóm     |       Của mình       |      Cửa hàng       |               |         |
| `order.return.approve` ⚠️ | Duyệt trả/đổi hàng                   |                   |    ✔     |             |                      |                     |               |         |

## Module `payment`

| Quyền                  | Mô tả                       | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| ---------------------- | --------------------------- | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `payment.read`         | Xem thanh toán và công nợ   |                   |    ✔     |    Nhóm     |       Của mình       |      Cửa hàng       |               |    ✔    |
| `payment.record` ⚠️    | Ghi nhận thanh toán         |                   |    ✔     |    Nhóm     |       Của mình       |                     |               |    ✔    |
| `payment.void` ⚠️      | Hủy ghi nhận thanh toán sai |                   |    ✔     |             |                      |                     |               |    ✔    |
| `payment.reconcile` ⚠️ | Đối soát thanh toán         |                   |    ✔     |             |                      |                     |               |    ✔    |
| `refund.request`       | Tạo yêu cầu hoàn tiền       |                   |    ✔     |    Nhóm     |       Của mình       |      Cửa hàng       |               |    ✔    |
| `refund.approve` 🔒 ⚠️ | Phê duyệt hoàn tiền         |                   |    ✔     |             |                      |                     |               |         |
| `refund.execute` 🔒 ⚠️ | Thực hiện hoàn tiền         |                   |    ✔     |             |                      |                     |               |         |

## Module `commission`

| Quyền                         | Mô tả                                        | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| ----------------------------- | -------------------------------------------- | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `commission.read`             | Xem hoa hồng                                 |                   |    ✔     |    Nhóm     |       Của mình       |      Của mình       |   Của mình    |    ✔    |
| `commission.policy.manage` ⚠️ | Cấu hình tỷ lệ/phiên bản chính sách hoa hồng |                   |    ✔     |             |                      |                     |               |         |
| `commission.approve` ⚠️       | Duyệt hoa hồng                               |                   |    ✔     |             |                      |                     |               |         |
| `commission.pay` ⚠️           | Ghi nhận chi hoa hồng                        |                   |    ✔     |             |                      |                     |               |    ✔    |
| `commission.period.close` ⚠️  | Chốt kỳ hoa hồng                             |                   |    ✔     |             |                      |                     |               |         |

## Module `report`

| Quyền                     | Mô tả                         | Quản trị hệ thống | Giám đốc | Trưởng nhóm | Nhân viên kinh doanh | Chăm sóc khách hàng | Nhân viên kho | Kế toán |
| ------------------------- | ----------------------------- | :---------------: | :------: | :---------: | :------------------: | :-----------------: | :-----------: | :-----: |
| `dashboard.director.read` | Xem dashboard giám đốc        |                   |    ✔     |             |                      |                     |               |         |
| `dashboard.staff.read`    | Xem dashboard nhân viên       |                   |    ✔     |      ✔      |          ✔           |          ✔          |       ✔       |    ✔    |
| `report.sales.read`       | Xem báo cáo bán hàng          |                   |    ✔     |    Nhóm     |       Của mình       |                     |               |    ✔    |
| `report.finance.read` ⚠️  | Xem báo cáo tài chính         |                   |    ✔     |             |                      |                     |               |    ✔    |
| `report.inventory.read`   | Xem báo cáo kho               |                   |    ✔     |             |                      |                     |       ✔       |    ✔    |
| `notification.read`       | Nhận thông báo trong ứng dụng |         ✔         |    ✔     |      ✔      |          ✔           |          ✔          |       ✔       |    ✔    |
