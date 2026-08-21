'use server'

import { randomUUID, timingSafeEqual } from 'node:crypto'

import { and, eq, isNull } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'

import { auth } from '#/infrastructure/auth/auth'
import { account, organization } from '#/infrastructure/auth/db/schema'
import { db } from '#/infrastructure/database'

import { doctorAssociationEligibility } from '../association'
import { doctorClient } from '../db/schema'
import { resolveDoctorClient } from '../services/client'

const GOOGLE_COMPLETION_INTENT_COOKIE = 'google-doctor-completion-intent'
const GOOGLE_COMPLETION_INTENT_MAX_AGE_SECONDS = 10 * 60

export type DoctorAssociationResult =
  | { success: true; doctorClientId: string; state: 'linked' | 'created' }
  | { success: false; error: 'GOOGLE_FLOW_REQUIRED' | 'EMAIL_NOT_VERIFIED' | 'ORGANIZATION_UNAVAILABLE' | 'DOCTOR_ALREADY_LINKED' | 'USER_ALREADY_LINKED' | 'PROFILE_REQUIRED' }

export async function beginGoogleDoctorAssociationFlow() {
  const intent = randomUUID()
  const cookieStore = await cookies()
  cookieStore.set(GOOGLE_COMPLETION_INTENT_COOKIE, intent, {
    httpOnly: true,
    maxAge: GOOGLE_COMPLETION_INTENT_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return `/complete?googleIntent=${encodeURIComponent(intent)}`
}

async function consumeGoogleCompletionIntent(intent: string | null) {
  const cookieStore = await cookies()
  const expectedIntent = cookieStore.get(GOOGLE_COMPLETION_INTENT_COOKIE)?.value
  cookieStore.delete(GOOGLE_COMPLETION_INTENT_COOKIE)

  if (!intent || !expectedIntent || intent.length !== expectedIntent.length) return false
  return timingSafeEqual(Buffer.from(intent), Buffer.from(expectedIntent))
}

export async function associateCurrentGoogleUserWithDoctorClient(googleIntent: string | null): Promise<DoctorAssociationResult> {
  const hasGoogleFlowEvidence = await consumeGoogleCompletionIntent(googleIntent)
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('UNAUTHORIZED')

  const [googleAccount] = await db.select({ id: account.id }).from(account).where(and(
    eq(account.userId, session.user.id),
    eq(account.providerId, 'google'),
  )).limit(1)
  const eligibility = doctorAssociationEligibility({
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    hasGoogleAccount: Boolean(googleAccount),
    hasGoogleFlowEvidence,
    name: session.user.name,
  })
  if (!eligibility.eligible) return { success: false, error: eligibility.error }

  return db.transaction(async (tx) => {
    const organizations = await tx.select({ id: organization.id }).from(organization).limit(2)
    if (organizations.length !== 1) return { success: false, error: 'ORGANIZATION_UNAVAILABLE' } as const
    const organizationId = organizations[0].id

    const [matchingEmail] = await tx.select().from(doctorClient).where(and(
      eq(doctorClient.organizationId, organizationId),
      eq(doctorClient.email, eligibility.email),
    )).limit(1)
    if (matchingEmail?.userId === session.user.id) {
      return { success: true, doctorClientId: matchingEmail.id, state: 'linked' } as const
    }
    if (matchingEmail?.userId) return { success: false, error: 'DOCTOR_ALREADY_LINKED' } as const

    const [linkedToUser] = await tx.select().from(doctorClient).where(and(
      eq(doctorClient.organizationId, organizationId),
      eq(doctorClient.userId, session.user.id),
    )).limit(1)
    if (linkedToUser) return { success: false, error: 'USER_ALREADY_LINKED' } as const

    if (matchingEmail) {
      const [linked] = await tx.update(doctorClient).set({ userId: session.user.id, updatedAt: new Date() }).where(and(
        eq(doctorClient.id, matchingEmail.id),
        isNull(doctorClient.userId),
      )).returning()
      if (linked) return { success: true, doctorClientId: linked.id, state: 'linked' } as const
      return { success: false, error: 'DOCTOR_ALREADY_LINKED' } as const
    }

    const resolved = await resolveDoctorClient(tx, organizationId, {
      ...eligibility.fields,
      email: eligibility.email,
      maternalLastName: null,
      professionalLicense: null,
      specialty: null,
      clinicName: null,
      phone: null,
      userId: session.user.id,
    })
    if (resolved.doctorClient.userId && resolved.doctorClient.userId !== session.user.id) {
      return { success: false, error: 'DOCTOR_ALREADY_LINKED' } as const
    }
    if (!resolved.doctorClient.userId) {
      return { success: false, error: 'DOCTOR_ALREADY_LINKED' } as const
    }
    return { success: true, doctorClientId: resolved.doctorClient.id, state: resolved.state === 'created' ? 'created' : 'linked' } as const
  })
}

export async function associateCurrentGoogleUserWithDoctorClientAction(googleIntent: string | null) {
  try {
    return await associateCurrentGoogleUserWithDoctorClient(googleIntent)
  } catch {
    return { success: false as const, error: 'ORGANIZATION_UNAVAILABLE' as const }
  }
}
