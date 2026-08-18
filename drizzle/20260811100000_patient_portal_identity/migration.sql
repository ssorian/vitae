ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");--> statement-breakpoint
CREATE TYPE "patient_portal_invitation_delivery" AS ENUM('email', 'printed');--> statement-breakpoint
CREATE TABLE "patient_account" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "patient_id" uuid NOT NULL UNIQUE,
  "user_id" text NOT NULL UNIQUE,
  "verified_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "patient_portal_invitation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "patient_id" uuid NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "delivery" "patient_portal_invitation_delivery" NOT NULL,
  "created_by_user_id" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "patient_account" ADD CONSTRAINT "patient_account_patient_id_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "patient_account" ADD CONSTRAINT "patient_account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "patient_portal_invitation" ADD CONSTRAINT "patient_portal_invitation_patient_id_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "patient_portal_invitation" ADD CONSTRAINT "patient_portal_invitation_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id");
