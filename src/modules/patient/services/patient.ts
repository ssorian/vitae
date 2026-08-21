/* eslint-disable @typescript-eslint/no-explicit-any */
import { and, eq, or, sql } from 'drizzle-orm'

import { patient } from '#/modules/patient/db/schema'
import { normalizePatientContact, type NewPatientInput } from '../schemas/patient'

export type PatientMatch = {
  id: string
  firstName: string
  paternalLastName: string | null
  maternalLastName: string | null
  phone: string | null
  email: string | null
}

export async function findPatientMatches(tx: any, organizationId: string, input: Pick<NewPatientInput, 'phone' | 'email'>) {
  const { email, phone } = normalizePatientContact(input)
  const contact = or(
    email ? sql`lower(${patient.email}) = ${email}` : undefined,
    phone ? sql`regexp_replace(${patient.phone}, '[^0-9]', '', 'g') = ${phone}` : undefined,
  )
  return tx.select({ id: patient.id, firstName: patient.firstName, paternalLastName: patient.paternalLastName, maternalLastName: patient.maternalLastName, phone: patient.phone, email: patient.email }).from(patient).where(and(eq(patient.organizationId, organizationId), contact))
}

export async function resolvePatientCreation(tx: any, organizationId: string, input: NewPatientInput, createNewAnyway = false): Promise<{ matches: PatientMatch[] } | { patient: PatientMatch }> {
  const matches = await findPatientMatches(tx, organizationId, input)
  if (matches.length && !createNewAnyway) return { matches }

  const { email, phone } = normalizePatientContact(input)
  const [created] = await tx.insert(patient).values({
    organizationId,
    firstName: input.firstName.trim(),
    paternalLastName: input.paternalLastName.trim(),
    maternalLastName: input.maternalLastName?.trim() || null,
    birthDate: input.birthDate || null,
    email,
    phone,
  }).returning({ id: patient.id, firstName: patient.firstName, paternalLastName: patient.paternalLastName, maternalLastName: patient.maternalLastName, phone: patient.phone, email: patient.email })
  return { patient: created }
}
