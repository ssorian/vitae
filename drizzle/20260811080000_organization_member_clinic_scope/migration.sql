ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "assigned_clinic_id" uuid;
ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true;
ALTER TABLE "clinic" ADD COLUMN IF NOT EXISTS "laboratory_enabled" boolean NOT NULL DEFAULT false;

ALTER TABLE "member" ADD CONSTRAINT "member_assigned_clinic_organization_fk" FOREIGN KEY ("assigned_clinic_id", "organization_id") REFERENCES "clinic"("id", "organization_id");
ALTER TABLE "member" ADD CONSTRAINT "member_assistant_assigned_clinic_check" CHECK ("role" <> 'assistant' OR "assigned_clinic_id" IS NOT NULL) NOT VALID;
