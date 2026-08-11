import { sql } from 'drizzle-orm'
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { organization, member, user } from '#/infrastructure/auth/db/schema'
import { clinic } from '#/modules/clinic/db/schema'
import { patient } from '#/modules/patient/db/schema'
import { order } from '#/modules/order/db/schema'

export const calendarResourceType = pgEnum('calendar_resource_type', ['dentist', 'equipment', 'room', 'chair', 'other'])
export const calendarResourceStatus = pgEnum('calendar_resource_status', ['active', 'inactive'])
export const appointmentKind = pgEnum('appointment_kind', ['clinical', 'study'])
export const appointmentSource = pgEnum('appointment_source', ['internal', 'whatsapp', 'public_order'])
export const appointmentStatus = pgEnum('appointment_status', ['requested', 'scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'rejected', 'no_show'])
export const appointmentEventType = pgEnum('appointment_event_type', ['created', 'requested', 'scheduled', 'rescheduled', 'checked_in', 'started', 'completed', 'cancelled', 'rejected', 'no_show'])

export const calendarResource = pgTable('calendar_resource', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  clinicId: uuid('clinic_id').notNull().references(() => clinic.id, { onDelete: 'cascade' }),
  type: calendarResourceType('type').notNull(),
  memberId: text('member_id').references(() => member.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  status: calendarResourceStatus('status').notNull().default('active'),
  isPublicBookingDefault: boolean('is_public_booking_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('calendar_resource_organization_clinic_idx').on(t.organizationId, t.clinicId), index('calendar_resource_member_idx').on(t.memberId), uniqueIndex('calendar_resource_public_booking_default_unique').on(t.clinicId).where(sql`${t.isPublicBookingDefault} and ${t.status} = 'active'`)])

export const resourceAvailability = pgTable('resource_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceId: uuid('resource_id').notNull().references(() => calendarResource.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
}, (t) => [index('resource_availability_resource_day_idx').on(t.resourceId, t.dayOfWeek)])

export const resourceBlock = pgTable('resource_block', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceId: uuid('resource_id').notNull().references(() => calendarResource.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('resource_block_resource_time_idx').on(t.resourceId, t.startsAt, t.endsAt)])

export const appointment = pgTable('appointment', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  clinicId: uuid('clinic_id').notNull().references(() => clinic.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').notNull().references(() => patient.id),
  orderId: uuid('order_id').references(() => order.id),
  kind: appointmentKind('kind').notNull(),
  source: appointmentSource('source').notNull().default('internal'),
  status: appointmentStatus('status').notNull().default('requested'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  notes: text('notes'),
  createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('appointment_organization_clinic_time_idx').on(t.organizationId, t.clinicId, t.startsAt), index('appointment_patient_time_idx').on(t.patientId, t.startsAt), index('appointment_order_idx').on(t.orderId), uniqueIndex('appointment_order_unique').on(t.orderId).where(sql`${t.orderId} is not null and ${t.status} not in ('completed', 'cancelled', 'rejected', 'no_show')`)])

export const appointmentReservation = pgTable('appointment_reservation', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointment.id, { onDelete: 'cascade' }),
  resourceId: uuid('resource_id').notNull().references(() => calendarResource.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  active: boolean('active').notNull().default(true),
}, (t) => [uniqueIndex('appointment_reservation_appointment_resource_unique').on(t.appointmentId, t.resourceId), index('appointment_reservation_resource_time_idx').on(t.resourceId, t.startsAt, t.endsAt)])

export const appointmentEvent = pgTable('appointment_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointment.id, { onDelete: 'cascade' }),
  type: appointmentEventType('type').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('appointment_event_appointment_idx').on(t.appointmentId)])
