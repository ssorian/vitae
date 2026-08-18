import { boolean, check, foreignKey, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { clinic } from '#/modules/clinic/db/schema'
import { patient } from '#/modules/patient/db/schema'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: varchar("slug", { length: 255 }).notNull().unique(),
	logo: text("logo"),
	metadata: text("metadata"),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
});

export const member = pgTable("member", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	role: text("role").notNull(),
	assignedClinicId: uuid("assigned_clinic_id"),
	active: boolean("active").notNull().default(true),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex('member_id_organization_id_unique').on(table.id, table.organizationId),
  foreignKey({
    columns: [table.assignedClinicId, table.organizationId],
    foreignColumns: [clinic.id, clinic.organizationId],
    name: 'member_assigned_clinic_organization_fk',
  }),
  check('member_assistant_assigned_clinic_check', sql`${table.role} <> 'assistant' OR ${table.assignedClinicId} IS NOT NULL`),
]);

export const invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	email: text("email").notNull(),
	inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
	role: text("role"),
	status: text("status").notNull(),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
	expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }).notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text("active_organization_id"),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const patientPortalInvitationDeliveryEnum = pgEnum('patient_portal_invitation_delivery', [
  'email',
  'printed',
])

export const patientAccount = pgTable('patient_account', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .notNull()
    .unique()
    .references(() => patient.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const patientPortalInvitation = pgTable('patient_portal_invitation', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patient.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  delivery: patientPortalInvitationDeliveryEnum('delivery').notNull(),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})
