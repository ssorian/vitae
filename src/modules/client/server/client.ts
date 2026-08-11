// src/modules/client/server/client.service.ts

import { db } from '#/infrastructure/database'
import { organization } from '#/infrastructure/auth/db/schema'

export async function getPlatformOrganization() {
  const organizations = await db
    .select({
      id: organization.id,
    })
    .from(organization)
    .limit(2)

  if (organizations.length === 0) {
    throw new Error('ORGANIZATION_NOT_FOUND')
  }

  if (organizations.length > 1) {
    throw new Error('MULTIPLE_ORGANIZATIONS_NOT_SUPPORTED')
  }

  return organizations[0]
}