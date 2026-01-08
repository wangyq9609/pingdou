-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(500),
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemption_codes" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "code_type" VARCHAR(20) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "batch_id" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'unused',
    "max_usage_count" INTEGER NOT NULL DEFAULT 1,
    "current_usage_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "created_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "redemption_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activations" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "redemption_code_id" BIGINT NOT NULL,
    "code_type" VARCHAR(20) NOT NULL,
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_projects" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "project_name" VARCHAR(200) NOT NULL,
    "original_image_url" VARCHAR(500),
    "config" JSONB,
    "grid_data" JSONB,
    "color_palette" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemption_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "redemption_code_id" BIGINT,
    "action" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "result" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemption_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "redemption_codes_code_key" ON "redemption_codes"("code");

-- CreateIndex
CREATE INDEX "redemption_codes_code_idx" ON "redemption_codes"("code");

-- CreateIndex
CREATE INDEX "redemption_codes_status_idx" ON "redemption_codes"("status");

-- CreateIndex
CREATE INDEX "redemption_codes_batch_id_idx" ON "redemption_codes"("batch_id");

-- CreateIndex
CREATE INDEX "user_activations_user_id_idx" ON "user_activations"("user_id");

-- CreateIndex
CREATE INDEX "user_activations_expires_at_idx" ON "user_activations"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_activations_user_id_redemption_code_id_key" ON "user_activations"("user_id", "redemption_code_id");

-- CreateIndex
CREATE INDEX "user_projects_user_id_idx" ON "user_projects"("user_id");

-- CreateIndex
CREATE INDEX "redemption_logs_user_id_idx" ON "redemption_logs"("user_id");

-- CreateIndex
CREATE INDEX "redemption_logs_redemption_code_id_idx" ON "redemption_logs"("redemption_code_id");

-- CreateIndex
CREATE INDEX "redemption_logs_created_at_idx" ON "redemption_logs"("created_at");

-- AddForeignKey
ALTER TABLE "redemption_codes" ADD CONSTRAINT "redemption_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activations" ADD CONSTRAINT "user_activations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activations" ADD CONSTRAINT "user_activations_redemption_code_id_fkey" FOREIGN KEY ("redemption_code_id") REFERENCES "redemption_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemption_logs" ADD CONSTRAINT "redemption_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemption_logs" ADD CONSTRAINT "redemption_logs_redemption_code_id_fkey" FOREIGN KEY ("redemption_code_id") REFERENCES "redemption_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
