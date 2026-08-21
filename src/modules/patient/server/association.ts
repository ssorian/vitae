'use server'

import { and, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'

import { auth } from '#/infrastructure/auth/auth'
import { organization, patientAccount } from '#/infrastructure/auth/db/schema'
import { db } from '#/infrastructure/database'
import { patient } from '#/modules/patient/db/schema'

import { patientFieldsFromAccountName, patientMatchesAccount } from '../association'

export type PatientAssociationResult =
  | { success: true; patientId: string; state: 'linked' | 'created' }
  | { success: false; error: 'ORGANIZATION_UNAVAILABLE' | 'AMBIGUOUS_PATIENT' | 'PATIENT_ALREADY_LINKED' }

export async function associateCurrentUserWithPatient(): Promise<PatientAssociationResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('UNAUTHORIZED')

  return db.transaction(async (tx) => {
    const organizations = await tx.select({ id: organization.id }).from(organization)
    if (organizations.length !== 1) return { success: false, error: 'ORGANIZATION_UNAVAILABLE' } as const

    const [existingAccount] = await tx.select({ patientId: patientAccount.patientId }).from(patientAccount).where(eq(patientAccount.userId, session.user.id))
    if (existingAccount) return { success: true, patientId: existingAccount.patientId, state: 'linked' } as const

    const candidates = await tx.select({
      id: patient.id,
      firstName: patient.firstName,
      paternalLastName: patient.paternalLastName,
      maternalLastName: patient.maternalLastName,
      email: patient.email,
      phone: patient.phone,
    }).from(patient).where(and(eq(patient.organizationId, organizations[0].id), sql`lower(${patient.email}) = ${session.user.email.trim().toLowerCase()}`))
    const matches = candidates.filter((candidate) => patientMatchesAccount(candidate, { name: session.user.name, email: session.user.email }))

    if (matches.length > 1) return { success: false, error: 'AMBIGUOUS_PATIENT' } as const
    if (matches.length === 1) {
      const [linkedAccount] = await tx.select({ id: patientAccount.id }).from(patientAccount).where(eq(patientAccount.patientId, matches[0].id))
      if (linkedAccount) return { success: false, error: 'PATIENT_ALREADY_LINKED' } as const
      await tx.insert(patientAccount).values({ patientId: matches[0].id, userId: session.user.id, verifiedAt: new Date() })
      return { success: true, patientId: matches[0].id, state: 'linked' } as const
    }

    const fields = patientFieldsFromAccountName(session.user.name)
    const [createdPatient] = await tx.insert(patient).values({
      organizationId: organizations[0].id,
      ...fields,
      email: session.user.email.trim().toLowerCase(),
      phone: null,
    }).returning({ id: patient.id })
    await tx.insert(patientAccount).values({ patientId: createdPatient.id, userId: session.user.id, verifiedAt: new Date() })
    return { success: true, patientId: createdPatient.id, state: 'created' } as const
  })
}

export async function associateCurrentUserAction() {
  try {
    return await associateCurrentUserWithPatient()
  } catch {
    return { success: false as const, error: 'ORGANIZATION_UNAVAILABLE' as const }
  }
}

export async function getCurrentPatientAccountAction() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const [account] = await db.select({ patientId: patientAccount.patientId, revokedAt: patientAccount.revokedAt }).from(patientAccount).where(eq(patientAccount.userId, session.user.id))
  return account && !account.revokedAt ? { patientId: account.patientId } : null
}
