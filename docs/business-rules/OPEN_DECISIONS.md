# Quyết định nghiệp vụ cần chủ doanh nghiệp xác nhận

Các điểm dưới đây ảnh hưởng tới **tiền, kho, phân quyền hoặc pháp lý**, nên theo đặc tả §11 không
được tự giả định. Mỗi điểm có đề xuất mặc định; điểm chặn sprint nào thì phải chốt trước sprint đó.

| Mã   | Câu hỏi                                                                                                                    | Đề xuất                                                                                   | Chặn sprint |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| D-01 | Làm tròn tiền: VAT tính trên từng dòng hay tổng đơn? Làm tròn hoa hồng thế nào?                                            | VAT làm tròn nửa lên (HALF_UP) trên từng dòng; hoa hồng làm tròn xuống (FLOOR) tới đồng   | 3, 5        |
| D-02 | Hoa hồng “đủ điều kiện” khi nào?                                                                                           | Đơn COMPLETED + đã thu đủ tiền + hết thời hạn đổi trả (đề xuất 7 ngày, cấu hình được)     | 5           |
| D-03 | Giá bán niêm yết, giá sàn là giá **đã gồm VAT** hay **chưa VAT**?                                                          | Đã gồm VAT (thói quen bán lẻ); hệ thống tách giá chưa VAT để tính doanh thu thuần         | 3           |
| D-04 | Thời hạn hiệu lực của phê duyệt bán dưới giá sàn?                                                                          | 24 giờ kể từ khi duyệt, cấu hình được; luôn mất hiệu lực khi đơn thay đổi                 | 4           |
| D-05 | Ai duyệt chứng từ nhập kho thông thường (nhập hàng từ nhà cung cấp)?                                                       | Giám đốc (mặc định hiện tại); có thể ủy quyền cho Trưởng nhóm qua ma trận quyền           | 3           |
| D-06 | Ai duyệt trả/đổi hàng của khách?                                                                                           | Giám đốc (mặc định hiện tại)                                                              | 4           |
| D-07 | Vai trò nào bắt buộc MFA?                                                                                                  | Super Admin, Giám đốc, Kế toán                                                            | 1           |
| D-08 | Ai được hủy ghi nhận thanh toán sai (`payment.void`)?                                                                      | Kế toán và Giám đốc, bắt buộc lý do, chỉ khi chưa đối soát                                | 4           |
| D-09 | Có cho bán công nợ (giao hàng trước khi thu đủ)? Ai duyệt và hạn mức?                                                      | Có; Giám đốc duyệt theo hạn mức từng khách                                                | 4           |
| D-10 | Giá vốn: phương pháp tính? Hàng serial dùng giá vốn đích danh?                                                             | Serial: đích danh theo phiếu nhập; không serial: bình quân gia quyền di động              | 3           |
| D-11 | Super Admin có được xem dữ liệu kinh doanh (khách, đơn, tiền) không?                                                       | Không (chỉ quản trị kỹ thuật + nhật ký); Giám đốc có toàn quyền nghiệp vụ                 | 1           |
| D-12 | Ai được gán vai trò Giám đốc cho tài khoản?                                                                                | Chỉ Super Admin, bắt buộc MFA, ghi audit, thông báo cho mọi Giám đốc hiện tại             | 1           |
| D-13 | Hóa đơn điện tử (Nghị định 123/2020) có tích hợp trong CRM không?                                                          | Ngoài phạm vi giai đoạn đầu; lưu số hóa đơn nhập tay                                      | 4           |
| D-14 | Nhập dữ liệu từ phần mềm cũ: khách hàng, sản phẩm, tồn đầu kỳ, công nợ?                                                    | Cần file mẫu từ phần mềm cũ; tồn đầu kỳ nhập bằng chứng từ “Tồn đầu kỳ” do Giám đốc duyệt | 2, 3        |
| D-15 | Khách hàng: định danh trùng theo số điện thoại hay cả email/CCCD?                                                          | Số điện thoại chuẩn hóa là khóa chính để phát hiện trùng; email là phụ                    | 2           |
| D-16 | Đồng ý tiếp thị: kênh nào (SMS, Zalo, email, gọi điện) và lưu bằng chứng gì? (Nghị định 13/2023 về bảo vệ dữ liệu cá nhân) | Lưu theo từng kênh, thời điểm, nguồn, người ghi nhận                                      | 2           |
