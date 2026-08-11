ALTER TABLE "calendar_resource" ADD COLUMN "is_public_booking_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_resource_public_booking_default_unique" ON "calendar_resource" ("clinic_id") WHERE "is_public_booking_default" AND "status" = 'active';
