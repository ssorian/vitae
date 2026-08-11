import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { organization } from '#/infrastructure/auth/db/schema'

export const patientSexEnum = pgEnum('patient_sex', [
  'male',
  'female',
  'other',
  'unspecified',
])

export const patient = pgTable(
  'patient',
  {
    id: uuid('id')
      .defaultRandom()
      .primaryKey(),

    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, {
        onDelete: 'cascade',
      }),

    firstName: text('first_name')
      .notNull(),

    paternalLastName: text('paternal_last_name'),

    maternalLastName: text('maternal_last_name'),

    birthDate: date('birth_date'),

    sex: patientSexEnum('sex'),

    phone: text('phone'),

    email: text('email'),

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
    index('patient_organization_idx')
      .on(table.organizationId),

    index('patient_name_idx')
      .on(
        table.organizationId,
        table.firstName,
        table.paternalLastName,
      ),
  ],
)

export const patientHistory = pgTable(
  'patient_history',
  {
    id: uuid('id')
      .defaultRandom()
      .primaryKey(),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => patient.id, {
        onDelete: 'cascade',
      }),

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
    uniqueIndex('patient_history_patient_unique')
      .on(table.patientId),
  ],
)
