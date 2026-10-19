-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('INVITED', 'ACTIVE', 'LOCKED', 'DISABLED');

-- CreateEnum
CREATE TYPE "permission_scope" AS ENUM ('OWN', 'TEAM', 'STORE', 'ORG');

-- CreateEnum
CREATE TYPE "team_member_role" AS ENUM ('MEMBER', 'LEAD');

-- CreateEnum
CREATE TYPE "access_event" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'MFA_SUCCESS', 'MFA_FAILED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'SESSION_REVOKED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500),
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "store_id" UUID,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "primary_store_id" UUID,
    "email" VARCHAR(320) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "employee_code" VARCHAR(32),
    "password_hash" TEXT,
    "password_changed_at" TIMESTAMPTZ(3),
    "status" "user_status" NOT NULL DEFAULT 'INVITED',
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret_enc" TEXT,
    "last_login_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "team_member_role" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id","user_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "key" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "scoped" BOOLEAN NOT NULL,
    "director_only" BOOLEAN NOT NULL DEFAULT false,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_key" VARCHAR(100) NOT NULL,
    "scope" "permission_scope" NOT NULL,
    "granted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_key")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "store_id" UUID,
    "granted_by_id" UUID,
    "granted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mfa_verified_at" TIMESTAMPTZ(3),
    "ip" INET,
    "user_agent" VARCHAR(500),
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_reason" VARCHAR(255),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "identifier" VARCHAR(320),
    "event" "access_event" NOT NULL,
    "ip" INET,
    "user_agent" VARCHAR(500),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "organization_id" UUID,
    "actor_user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100),
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "request_id" VARCHAR(100),
    "ip" INET,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "scope" VARCHAR(150) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "locked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("scope","key")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "organization_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("organization_id","key")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stores_organization_id_code_key" ON "stores"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_organization_id_code_key" ON "warehouses"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "teams_store_id_name_key" ON "teams"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_employee_code_key" ON "users"("organization_id", "employee_code");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_at_idx" ON "sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "access_logs_user_id_created_at_idx" ON "access_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "access_logs_created_at_idx" ON "access_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE INDEX "outbox_events_processed_at_available_at_idx" ON "outbox_events"("processed_at", "available_at");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_primary_store_id_fkey" FOREIGN KEY ("primary_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_key_fkey" FOREIGN KEY ("permission_key") REFERENCES "permissions"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================================================
-- Ràng buộc bổ sung mà Prisma schema không biểu diễn được.
-- Mỗi ràng buộc dưới đây có kiểm thử tích hợp trong apps/api/test/integration.
-- =====================================================================================

-- Email unique không phân biệt hoa thường trong một tổ chức.
CREATE UNIQUE INDEX "users_organization_id_email_lower_key" ON "users" ("organization_id", lower("email"));

-- Một vai trò chỉ gán một lần cho một nhân viên trên cùng phạm vi cửa hàng (NULL = mọi cửa hàng).
CREATE UNIQUE INDEX "user_roles_user_role_store_key" ON "user_roles" ("user_id", "role_id", "store_id") NULLS NOT DISTINCT;

-- Mỗi tổ chức có tối đa một kho chính; mỗi nhóm tối đa một trưởng nhóm.
CREATE UNIQUE INDEX "warehouses_one_main_per_org" ON "warehouses" ("organization_id") WHERE "is_main";
CREATE UNIQUE INDEX "team_members_one_lead_per_team" ON "team_members" ("team_id") WHERE "role" = 'LEAD';

ALTER TABLE "organizations" ADD CONSTRAINT "organizations_code_format" CHECK ("code" ~ '^[A-Z0-9_-]{2,32}$');
ALTER TABLE "stores" ADD CONSTRAINT "stores_code_format" CHECK ("code" ~ '^[A-Z0-9_-]{2,32}$');
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_code_format" CHECK ("code" ~ '^[A-Z0-9_-]{2,32}$');
ALTER TABLE "users" ADD CONSTRAINT "users_email_format" CHECK ("email" ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
ALTER TABLE "users" ADD CONSTRAINT "users_failed_login_count_nonneg" CHECK ("failed_login_count" >= 0);
ALTER TABLE "users" ADD CONSTRAINT "users_version_positive" CHECK ("version" >= 1);
ALTER TABLE "users" ADD CONSTRAINT "users_active_requires_password"
  CHECK ("status" NOT IN ('ACTIVE', 'LOCKED') OR "password_hash" IS NOT NULL);
ALTER TABLE "users" ADD CONSTRAINT "users_mfa_requires_secret"
  CHECK (NOT "mfa_enabled" OR "mfa_secret_enc" IS NOT NULL);
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_expiry_after_creation" CHECK ("expires_at" > "created_at");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_hash_hex" CHECK ("token_hash" ~ '^[0-9a-f]{64}$');
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_expiry_after_creation" CHECK ("expires_at" > "created_at");
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_attempts_nonneg" CHECK ("attempts" >= 0);
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_version_positive" CHECK ("version" >= 1);

-- -------------------------------------------------------------------------------------
-- Bảng log append-only: chặn UPDATE, DELETE, TRUNCATE ở mức database.
-- -------------------------------------------------------------------------------------
CREATE FUNCTION crm_forbid_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'CRM_APPEND_ONLY: bảng % chỉ cho phép thêm mới (%)', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'P0001';
END;
$$;

CREATE TRIGGER "audit_logs_append_only" BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION crm_forbid_mutation();
CREATE TRIGGER "audit_logs_no_truncate" BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION crm_forbid_mutation();
CREATE TRIGGER "access_logs_append_only" BEFORE UPDATE OR DELETE ON "access_logs"
  FOR EACH ROW EXECUTE FUNCTION crm_forbid_mutation();
CREATE TRIGGER "access_logs_no_truncate" BEFORE TRUNCATE ON "access_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION crm_forbid_mutation();

-- -------------------------------------------------------------------------------------
-- QUY TẮC ĐÃ KHÓA: quyền director_only chỉ được gán cho vai trò DIRECTOR.
-- Lớp ứng dụng (validateGrant) kiểm tra trước; trigger là hàng rào cuối cùng chống bypass.
-- -------------------------------------------------------------------------------------
CREATE FUNCTION crm_check_role_permission() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_director_only boolean;
  v_scoped boolean;
  v_role_code text;
BEGIN
  SELECT p.director_only, p.scoped INTO v_director_only, v_scoped
    FROM permissions p WHERE p.key = NEW.permission_key;
  SELECT r.code INTO v_role_code FROM roles r WHERE r.id = NEW.role_id;

  IF v_director_only AND v_role_code IS DISTINCT FROM 'DIRECTOR' THEN
    RAISE EXCEPTION 'CRM_DIRECTOR_ONLY: quyền % chỉ dành cho vai trò DIRECTOR, không gán được cho %',
      NEW.permission_key, v_role_code USING ERRCODE = 'P0001';
  END IF;

  IF NOT v_scoped AND NEW.scope <> 'ORG' THEN
    RAISE EXCEPTION 'CRM_SCOPE_INVALID: quyền % không phân phạm vi, scope phải là ORG',
      NEW.permission_key USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "role_permissions_check" BEFORE INSERT OR UPDATE ON "role_permissions"
  FOR EACH ROW EXECUTE FUNCTION crm_check_role_permission();

-- Không cho đổi mã vai trò đang nắm quyền director_only sang mã khác DIRECTOR.
CREATE FUNCTION crm_check_role_code_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.code IS DISTINCT FROM OLD.code AND NEW.code <> 'DIRECTOR' AND EXISTS (
    SELECT 1 FROM role_permissions rp JOIN permissions p ON p.key = rp.permission_key
    WHERE rp.role_id = NEW.id AND p.director_only
  ) THEN
    RAISE EXCEPTION 'CRM_DIRECTOR_ONLY: vai trò % đang nắm quyền chỉ-giám-đốc, không thể đổi mã', OLD.code
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "roles_code_change_check" BEFORE UPDATE OF "code" ON "roles"
  FOR EACH ROW EXECUTE FUNCTION crm_check_role_code_change();

-- Không cho bật director_only trên quyền đang được gán cho vai trò khác DIRECTOR.
CREATE FUNCTION crm_check_permission_flag_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.director_only AND NOT OLD.director_only AND EXISTS (
    SELECT 1 FROM role_permissions rp JOIN roles r ON r.id = rp.role_id
    WHERE rp.permission_key = NEW.key AND r.code <> 'DIRECTOR'
  ) THEN
    RAISE EXCEPTION 'CRM_DIRECTOR_ONLY: quyền % đang được gán cho vai trò khác DIRECTOR', NEW.key
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "permissions_flag_change_check" BEFORE UPDATE OF "director_only" ON "permissions"
  FOR EACH ROW EXECUTE FUNCTION crm_check_permission_flag_change();
