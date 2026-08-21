/* eslint-disable @typescript-eslint/no-explicit-any */

import { and, eq } from 'drizzle-orm'

import { db } from '#/infrastructure/database'

import { doctorClient } from '../db/schema'
import { doctorClientResolutionState } from '../resolution'
import { normalizeDoctorClientEmail, type DoctorClientInput } from '../schemas/client'

export function findDoctorClientByUserId(organizationId: string, userId: string) {
  return db.query.doctorClient.findFirst({ where: { organizationId, userId } })
}

export function findDoctorClientByEmail(organizationId: string, email: string) {
  return db.query.doctorClient.findFirst({ where: { organizationId, email: normalizeDoctorClientEmail(email) } })
}

export async function createDoctorClient(values: typeof doctorClient.$inferInsert) {
  const [created] = await db.insert(doctorClient).values(values).returning()
  return created
}

export async function updateDoctorClient(id: string, values: Partial<typeof doctorClient.$inferInsert>) {
  const [updated] = await db.update(doctorClient).set({ ...values, updatedAt: new Date() }).where(eq(doctorClient.id, id)).returning()
  return updated
}

export async function resolveDoctorClient(
  tx: any,
  organizationId: string,
  input: DoctorClientInput & { userId?: string | null },
) {
  const existing = await tx.query.doctorClient.findFirst({
    where: { organizationId, email: input.email },
  })
  if (doctorClientResolutionState(existing) === 'existing') return { doctorClient: existing, state: 'existing' as const }

  const [created] = await tx.insert(doctorClient).values({
    organizationId,
    userId: input.userId ?? null,
    firstName: input.firstName,
    paternalLastName: input.paternalLastName,
    maternalLastName: input.maternalLastName,
    professionalLicense: input.professionalLicense,
    specialty: input.specialty,
    clinicName: input.clinicName,
    phone: input.phone,
    email: input.email,
  }).onConflictDoNothing({ target: [doctorClient.organizationId, doctorClient.email] }).returning()

  if (created) return { doctorClient: created, state: 'created' as const }

  const [resolved] = await tx.select().from(doctorClient).where(and(
    eq(doctorClient.organizationId, organizationId),
    eq(doctorClient.email, input.email),
  ))
  if (!resolved) throw new Error('DOCTOR_CLIENT_RESOLUTION_FAILED')

  return { doctorClient: resolved, state: 'existing' as const }
}
