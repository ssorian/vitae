import 'server-only'

import { and, eq } from 'drizzle-orm'

import { requireUser } from '#/infrastructure/auth/requireUser'
import { db } from '#/infrastructure/database'

import { doctorClient } from './db/schema'
import { getPlatformOrganization } from './server/client'

export async function requireDoctorClient() {
  const user = await requireUser()
  const organization = await getPlatformOrganization()
  const [client] = await db.select({
    id: doctorClient.id,
    firstName: doctorClient.firstName,
    paternalLastName: doctorClient.paternalLastName,
    email: doctorClient.email,
  }).from(doctorClient).where(and(
    eq(doctorClient.organizationId, organization.id),
    eq(doctorClient.userId, user.id),
    eq(doctorClient.status, 'active'),
  )).limit(1)

  if (!client) throw new Error('FORBIDDEN')

  return { user, organizationId: organization.id, doctorClient: client }
}
