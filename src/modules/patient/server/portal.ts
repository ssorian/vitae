'use server'

import { and, eq, gt, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { auth } from '#/infrastructure/auth/auth'
import { patientAccount, patientPortalInvitation, user } from '#/infrastructure/auth/db/schema'
import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { db } from '#/infrastructure/database'
import { patient } from '#/modules/patient/db/schema'

import {
  createPatientPortalInvitationToken,
  hashPatientPortalInvitationToken,
  isPatientPortalInvitationUsable,
  patientPortalActivationInputSchema,
  patientPortalInvitationExpiresAt,
  patientPortalInvitationInputSchema,
  patientPortalUserEmail,
} from '../portal'

async function patientForClinic(patientId: string, clinicId: string) {
  const context = await requireClinicAccess(clinicId)
  const [currentPatient] = await db.select().from(patient).where(and(
    eq(patient.id, patientId),
    eq(patient.organizationId, context.organizationId),
  ))
  if (!currentPatient) throw new Error('PATIENT_NOT_FOUND')
  return { context, patient: currentPatient }
}

export async function issuePatientPortalInvitationAction(input: unknown) {
  const data = patientPortalInvitationInputSchema.parse(input)
  const { context } = await patientForClinic(data.patientId, data.clinicId)
  const now = new Date()
  const token = createPatientPortalInvitationToken()
  const expiresAt = patientPortalInvitationExpiresAt(now)

  await db.transaction(async (tx) => {
    await tx.update(patientPortalInvitation).set({ revokedAt: now }).where(and(
      eq(patientPortalInvitation.patientId, data.patientId),
      isNull(patientPortalInvitation.usedAt),
      isNull(patientPortalInvitation.revokedAt),
    ))
    await tx.insert(patientPortalInvitation).values({
      patientId: data.patientId,
      tokenHash: hashPatientPortalInvitationToken(token),
      delivery: 'printed',
      createdByUserId: context.user.id,
      expiresAt,
    })
  })

  revalidatePath(`/clinics/${data.clinicId}`)
  return { token, expiresAt }
}

export async function revokePatientPortalInvitationAction(input: unknown) {
  const data = patientPortalInvitationInputSchema.parse(input)
  await patientForClinic(data.patientId, data.clinicId)
  await db.update(patientPortalInvitation).set({ revokedAt: new Date() }).where(and(
    eq(patientPortalInvitation.patientId, data.patientId),
    isNull(patientPortalInvitation.usedAt),
    isNull(patientPortalInvitation.revokedAt),
  ))
  revalidatePath(`/clinics/${data.clinicId}`)
}

export async function activatePatientPortalAction(input: unknown) {
  const data = patientPortalActivationInputSchema.parse(input)
  const now = new Date()
  const tokenHash = hashPatientPortalInvitationToken(data.token)
  const invitation = await db.query.patientPortalInvitation.findFirst({
    where: { tokenHash },
    with: { patient: true },
  })
  if (!invitation || !isPatientPortalInvitationUsable(invitation, now)) throw new Error('INVITATION_INVALID')

  const existingAccount = await db.query.patientAccount.findFirst({ where: { patientId: invitation.patientId } })
  if (existingAccount) throw new Error('PATIENT_ACCOUNT_EXISTS')

  let createdUser: { id: string }
  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: [invitation.patient.firstName, invitation.patient.paternalLastName, invitation.patient.maternalLastName].filter(Boolean).join(' '),
        email: patientPortalUserEmail(invitation.patient.id, invitation.patient.email),
        password: data.password,
        username: data.username,
      },
    })
    createdUser = result.user
  } catch {
    throw new Error('ACTIVATION_FAILED')
  }

  try {
    await db.transaction(async (tx) => {
      const [claimedInvitation] = await tx.update(patientPortalInvitation).set({ usedAt: now }).where(and(
        eq(patientPortalInvitation.id, invitation.id),
        isNull(patientPortalInvitation.usedAt),
        isNull(patientPortalInvitation.revokedAt),
        gt(patientPortalInvitation.expiresAt, now),
      )).returning({ id: patientPortalInvitation.id })
      if (!claimedInvitation) throw new Error('INVITATION_INVALID')

      const existing = await tx.query.patientAccount.findFirst({ where: { patientId: invitation.patientId } })
      if (existing) throw new Error('PATIENT_ACCOUNT_EXISTS')
      await tx.update(user).set({ emailVerified: true, updatedAt: now }).where(eq(user.id, createdUser.id))
      await tx.insert(patientAccount).values({ patientId: invitation.patientId, userId: createdUser.id, verifiedAt: now })
    })
  } catch (error) {
    await db.delete(user).where(eq(user.id, createdUser.id))
    throw error
  }

  return { patientId: invitation.patientId }
}
