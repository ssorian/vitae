import { organization, user } from '#/infrastructure/auth/db/schema'
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

export const doctorClientStatus = pgEnum(
  'doctor_client_status',
  [
    'active',
    'inactive',
  ],
)

export const doctorClient = pgTable(
  'doctor_client',
  {
    id: uuid('id')
      .defaultRandom()
      .primaryKey(),

    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, {
        onDelete: 'cascade',
      }),

    /**
     * Nullable hasta que el doctor cree/vincule su cuenta.
     */
    userId: text('user_id')
      .references(() => user.id, {
        onDelete: 'set null',
      }),

    firstName: text('first_name')
      .notNull(),

    paternalLastName: text('paternal_last_name')
      .notNull(),

    maternalLastName: text('maternal_last_name'),

    professionalLicense: text('professional_license'),

    specialty: text('specialty'),

    clinicName: text('clinic_name'),

    phone: text('phone'),

    email: text('email')
      .notNull(),

    status: doctorClientStatus('status')
      .default('active')
      .notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('doctor_client_organization_idx')
      .on(table.organizationId),

    uniqueIndex('doctor_client_org_user_unique')
      .on(
        table.organizationId,
        table.userId,
      ),

    uniqueIndex('doctor_client_org_email_unique')
      .on(
        table.organizationId,
        table.email,
      ),
  ],
)
