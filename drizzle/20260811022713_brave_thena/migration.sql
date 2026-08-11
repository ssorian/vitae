CREATE TYPE "clinic_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "order_asset_type" AS ENUM('pdf', 'image', 'dicom', 'zip', 'other');--> statement-breakpoint
CREATE TYPE "order_event_type" AS ENUM('order.created', 'order.scheduled', 'order.started', 'result.uploaded', 'result.finalized', 'email.sent', 'order.delivered', 'order.cancelled');--> statement-breakpoint
CREATE TYPE "order_source" AS ENUM('public', 'internal');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('draft', 'received', 'scheduled', 'in_progress', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "order_type" AS ENUM('radiography', 'cbct');--> statement-breakpoint
CREATE TYPE "patient_sex" AS ENUM('male', 'female', 'other', 'unspecified');--> statement-breakpoint
CREATE TYPE "doctor_client_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"inviter_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"created_at" timestamp(6) with time zone NOT NULL,
	"expires_at" timestamp(6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp(6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" varchar(255) NOT NULL UNIQUE,
	"logo" text,
	"metadata" text,
	"created_at" timestamp(6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "clinic" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"public_slug" text NOT NULL UNIQUE,
	"phone" text,
	"email" text,
	"address_line" text,
	"neighborhood" text,
	"municipality" text,
	"state" text,
	"postal_code" text,
	"timezone" text DEFAULT 'America/Mexico_City' NOT NULL,
	"status" "clinic_status" DEFAULT 'active'::"clinic_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"doctor_client_id" uuid NOT NULL,
	"patient_history_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"folio" text NOT NULL,
	"type" "order_type" NOT NULL,
	"status" "order_status" DEFAULT 'draft'::"order_status" NOT NULL,
	"source" "order_source" DEFAULT 'internal'::"order_source" NOT NULL,
	"details" jsonb NOT NULL,
	"details_schema_version" integer DEFAULT 1 NOT NULL,
	"expected_delivery_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"notes" text,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"name" text NOT NULL,
	"storage_key" text NOT NULL,
	"type" "order_asset_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"type" "order_event_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"observations" text,
	"realized_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"finalized_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"first_name" text NOT NULL,
	"paternal_last_name" text,
	"maternal_last_name" text,
	"birth_date" date,
	"sex" "patient_sex",
	"phone" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"patient_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"user_id" text,
	"first_name" text NOT NULL,
	"paternal_last_name" text NOT NULL,
	"maternal_last_name" text,
	"professional_license" text,
	"specialty" text,
	"clinic_name" text,
	"phone" text,
	"email" text NOT NULL,
	"status" "doctor_client_status" DEFAULT 'active'::"doctor_client_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "member_id_organization_id_unique" ON "member" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clinic_id_organization_id_unique" ON "clinic" ("id","organization_id");--> statement-breakpoint
CREATE INDEX "order_organization_idx" ON "order" ("organization_id");--> statement-breakpoint
CREATE INDEX "order_doctor_client_idx" ON "order" ("doctor_client_id");--> statement-breakpoint
CREATE INDEX "order_patient_history_idx" ON "order" ("patient_history_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "order_organization_folio_unique" ON "order" ("organization_id","folio");--> statement-breakpoint
CREATE INDEX "order_asset_order_idx" ON "order_asset" ("order_id");--> statement-breakpoint
CREATE INDEX "order_event_order_idx" ON "order_event" ("order_id");--> statement-breakpoint
CREATE INDEX "order_result_order_idx" ON "order_result" ("order_id");--> statement-breakpoint
CREATE INDEX "patient_organization_idx" ON "patient" ("organization_id");--> statement-breakpoint
CREATE INDEX "patient_name_idx" ON "patient" ("organization_id","first_name","paternal_last_name");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_history_patient_unique" ON "patient_history" ("patient_id");--> statement-breakpoint
CREATE INDEX "doctor_client_organization_idx" ON "doctor_client" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_client_org_user_unique" ON "doctor_client" ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_client_org_email_unique" ON "doctor_client" ("organization_id","email");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "clinic" ADD CONSTRAINT "clinic_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_doctor_client_id_doctor_client_id_fkey" FOREIGN KEY ("doctor_client_id") REFERENCES "doctor_client"("id");--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_patient_history_id_patient_history_id_fkey" FOREIGN KEY ("patient_history_id") REFERENCES "patient_history"("id");--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_clinic_id_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id");--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_asset" ADD CONSTRAINT "order_asset_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_result" ADD CONSTRAINT "order_result_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_result" ADD CONSTRAINT "order_result_finalized_by_user_id_user_id_fkey" FOREIGN KEY ("finalized_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "patient_history" ADD CONSTRAINT "patient_history_patient_id_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "doctor_client" ADD CONSTRAINT "doctor_client_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "doctor_client" ADD CONSTRAINT "doctor_client_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;