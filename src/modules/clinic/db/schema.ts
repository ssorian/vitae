import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { organization } from '#/infrastructure/auth/db/schema'

export const clinicStatusEnum = pgEnum('clinic_status', ['active', 'inactive'])

export const clinic = pgTable('clinic', {
  id: uuid('id').primaryKey().defaultRandom(),

  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),

  publicSlug: text('public_slug').notNull().unique(),

  phone: text('phone'),
  email: text('email'),

  addressLine: text('address_line'),
  neighborhood: text('neighborhood'),
  municipality: text('municipality'),
  state: text('state'),
  postalCode: text('postal_code'),

  timezone: text('timezone').notNull().default('America/Mexico_City'),

  slotIntervalMinutes: integer('slot_interval_minutes').notNull().default(15),

  status: clinicStatusEnum('status').notNull().default('active'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('clinic_id_organization_id_unique').on(table.id, table.organizationId),
])
