CREATE TYPE "order_result_grant_kind" AS ENUM('email', 'code');--> statement-breakpoint
CREATE TABLE "order_result_grant" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL,
  "kind" "order_result_grant_kind" NOT NULL,
  "secret_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_by_user_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "order_result_grant" ADD CONSTRAINT "order_result_grant_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_result_grant" ADD CONSTRAINT "order_result_grant_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX "order_result_grant_order_idx" ON "order_result_grant" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_result_grant_order_kind_unique" ON "order_result_grant" ("order_id", "kind");
