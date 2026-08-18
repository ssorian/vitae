ALTER TABLE "clinic" ADD COLUMN "public_hours" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
INSERT INTO "calendar_resource" ("organization_id", "clinic_id", "type", "name", "status", "is_public_booking_default")
SELECT "organization_id", "id", 'other', 'Reservas públicas', 'active', true
FROM "clinic"
ON CONFLICT ("clinic_id") WHERE "is_public_booking_default" AND "status" = 'active' DO NOTHING;
