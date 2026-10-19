-- Thay index NULLS NOT DISTINCT (Prisma Migrate không biểu diễn được nên báo drift) bằng hai
-- index partial tương đương: một vai trò chỉ gán một lần cho một nhân viên trên cùng phạm vi
-- cửa hàng; store_id NULL nghĩa là mọi cửa hàng.
DROP INDEX "user_roles_user_role_store_key";
CREATE UNIQUE INDEX "user_roles_user_role_all_stores_key" ON "user_roles" ("user_id", "role_id") WHERE "store_id" IS NULL;
CREATE UNIQUE INDEX "user_roles_user_role_store_key" ON "user_roles" ("user_id", "role_id", "store_id") WHERE "store_id" IS NOT NULL;
