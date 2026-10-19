# Quy ước REST API

- Đặc tả máy đọc: OpenAPI 3.1 tại `GET /api/openapi.json` (Swagger UI: `/api/docs`, tắt ở production
  trừ khi `OPENAPI_ENABLED=true`). Bản xuất commit trong repo: [openapi.json](./openapi.json)
  (`pnpm --filter @crm/api openapi:export`).
- Tiền tố và phiên bản: `/api/v1/...` (URI versioning). Thay đổi phá vỡ → `/api/v2`.

## Tài nguyên và phương thức

| Thao tác             | Mẫu                                                              | Ghi chú                                                                 |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Danh sách            | `GET /api/v1/customers?page=1&pageSize=20&sort=-createdAt&q=...` | `pageSize` ≤ 100; kết quả `{ data, meta: { page, pageSize, total } }`   |
| Chi tiết             | `GET /api/v1/customers/:id`                                      | Bản ghi ngoài phạm vi quyền → `404` (không tiết lộ tồn tại)             |
| Tạo                  | `POST /api/v1/customers`                                         | Thao tác tiền/kho/đơn **bắt buộc** `Idempotency-Key`                    |
| Sửa                  | `PATCH /api/v1/customers/:id` + `If-Match: <version>`            | Sai version → `409 VERSION_CONFLICT`                                    |
| Hành động trạng thái | `POST /api/v1/orders/:id/confirm`                                | Một endpoint cho mỗi sự kiện của state machine; không có `PATCH status` |

## Kiểu dữ liệu

- Tiền: **chuỗi số nguyên** đồng VND (`"1500000"`) để không mất chính xác trong JavaScript.
- Tỷ lệ: số nguyên basis point (`1000` = 10%).
- Thời gian: ISO 8601 UTC (`2026-10-19T17:00:00.000Z`); ngày nghiệp vụ dạng `YYYY-MM-DD` theo giờ Việt Nam.
- ID: UUID.
- Input được validate bằng Zod (schema dùng chung trong `@crm/shared`); trường lạ bị từ chối.

## Định dạng lỗi

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Đơn đã bị người khác sửa",
    "details": {},
    "requestId": "..."
  }
}
```

| HTTP | `code` tiêu biểu                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 400  | `BAD_REQUEST`, `VALIDATION_FAILED`                                                                                 |
| 401  | `UNAUTHENTICATED`, `MFA_REQUIRED`                                                                                  |
| 403  | `FORBIDDEN` (có quyền xem nhưng không có quyền thao tác)                                                           |
| 404  | `NOT_FOUND`                                                                                                        |
| 409  | `VERSION_CONFLICT`, `INVALID_STATE_TRANSITION`, `UNIQUE_VIOLATION`, `IDEMPOTENCY_IN_PROGRESS`                      |
| 422  | `PRICE_BELOW_FLOOR_REQUIRES_APPROVAL`, `INSUFFICIENT_STOCK`, `REFUND_EXCEEDS_REFUNDABLE`, `IDEMPOTENCY_KEY_REUSED` |
| 429  | `RATE_LIMITED`                                                                                                     |
| 500  | `INTERNAL_ERROR` (không bao giờ kèm stack/SQL)                                                                     |
| 503  | `SERVICE_UNAVAILABLE`                                                                                              |

## Header

| Header            | Hướng  | Ý nghĩa                                                                                |
| ----------------- | ------ | -------------------------------------------------------------------------------------- |
| `x-request-id`    | vào/ra | Truy vết; client có thể gửi (8–100 ký tự `[A-Za-z0-9._-]`), nếu không server sinh UUID |
| `Idempotency-Key` | vào    | Chống tạo trùng (lưu 24 giờ)                                                           |
| `If-Match`        | vào    | Phiên bản cho optimistic locking                                                       |
| `x-csrf-token`    | vào    | Bắt buộc với request thay đổi dữ liệu khi dùng cookie (Sprint 1)                       |

## Endpoint đã có (Sprint 0)

| Method | Path                             | Quyền                        | Mô tả                                                  |
| ------ | -------------------------------- | ---------------------------- | ------------------------------------------------------ |
| GET    | `/api/v1/health`                 | công khai                    | Liveness                                               |
| GET    | `/api/v1/health/ready`           | công khai                    | Readiness: PostgreSQL + Redis; `503` khi phụ thuộc lỗi |
| GET    | `/api/openapi.json`, `/api/docs` | công khai (tắt ở production) | Đặc tả OpenAPI 3.1                                     |
