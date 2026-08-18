import 'server-only'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

import { auth } from '#/infrastructure/auth/auth'
import { patientAccount } from '#/infrastructure/auth/db/schema'
import { db } from '#/infrastructure/database'

import { isPatientPortalOwnershipEligible } from './portal'

export async function resolvePatientOwnership(userId: string) {
  const [account] = await db
    .select({
      patientId: patientAccount.patientId,
      verifiedAt: patientAccount.verifiedAt,
      revokedAt: patientAccount.revokedAt,
    })
    .from(patientAccount)
    .where(eq(patientAccount.userId, userId))

  return account && isPatientPortalOwnershipEligible(account)
    ? { patientId: account.patientId }
    : null
}

export async function requirePatientOwnership() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    throw new Error('UNAUTHORIZED')
  }

  const ownership = await resolvePatientOwnership(session.user.id)

  if (!ownership) {
    throw new Error('FORBIDDEN')
  }

  return { user: session.user, ...ownership }
}
