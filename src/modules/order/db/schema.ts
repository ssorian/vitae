import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { organization, user } from '#/infrastructure/auth/db/schema'
import { patientHistory } from '#/modules/patient/db/schema'
import { doctorClient } from '#/modules/client/db/schema'
import { clinic } from '#/modules/clinic/db/schema'

export const orderSource = pgEnum('order_source', ['public', 'internal'])
export const orderType = pgEnum('order_type', ['radiography', 'cbct'])
export const orderStatus = pgEnum('order_status', ['draft', 'received', 'scheduled', 'in_progress', 'ready', 'delivered', 'cancelled'])

export const order = pgTable('order', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  doctorClientId: uuid('doctor_client_id').notNull().references(() => doctorClient.id),
  patientHistoryId: uuid('patient_history_id').notNull().references(() => patientHistory.id),
  clinicId: uuid('clinic_id').notNull().references(() => clinic.id),
  folio: text('folio').notNull(),
  type: orderType('type').notNull(),
  status: orderStatus('status').default('draft').notNull(),
  source: orderSource('source').default('internal').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().notNull(),
  detailsSchemaVersion: integer('details_schema_version').default(1).notNull(),
  expectedDeliveryAt: timestamp('expected_delivery_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  notes: text('notes'),
  createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('order_organization_idx').on(table.organizationId),
  index('order_doctor_client_idx').on(table.doctorClientId),
  index('order_patient_history_idx').on(table.patientHistoryId),
  index('order_status_idx').on(table.status),
  uniqueIndex('order_organization_folio_unique').on(table.organizationId, table.folio),
])

export const orderAssetType = pgEnum('order_asset_type', ['pdf', 'image', 'dicom', 'zip', 'other'])
export const orderEventType = pgEnum('order_event_type', ['order.created', 'order.scheduled', 'order.started', 'result.uploaded', 'result.finalized', 'email.sent', 'order.delivered', 'order.cancelled'])

export const orderResult = pgTable('order_result', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => order.id, { onDelete: 'cascade' }),
  observations: text('observations'),
  realizedAt: timestamp('realized_at', { withTimezone: true }),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  finalizedByUserId: text('finalized_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('order_result_order_unique').on(table.orderId),
])

export const orderAsset = pgTable('order_asset', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => order.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  storageKey: text('storage_key').notNull(),
  type: orderAssetType('type').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('order_asset_order_idx').on(table.orderId)])

export const orderEvent = pgTable('order_event', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => order.id, { onDelete: 'cascade' }),
  type: orderEventType('type').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('order_event_order_idx').on(table.orderId)])
