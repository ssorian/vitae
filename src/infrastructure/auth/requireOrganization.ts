// src/infrastructure/auth/requireOrganization.ts

import { headers } from 'next/headers'

import { auth } from '#/infrastructure/auth/auth'

export async function requireOrganization() {
  const session = await initializeActiveOrganization()

  if (!session) {
    throw new Error('UNAUTHORIZED')
  }

  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    throw new Error('ORGANIZATION_REQUIRED')
  }

  return {
    user: session.user,
    session: session.session,
    organizationId,
  }
}

export async function initializeActiveOrganization() {
  const requestHeaders = await headers()

  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  if (!session) {
    return null
  }

  if (session.session.activeOrganizationId) {
    return session
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  })

  // Si tu modelo permite múltiples organizaciones,
  // aquí NO deberías seleccionar arbitrariamente una.
  if (organizations.length !== 1) {
    return session
  }

  await auth.api.setActiveOrganization({
    headers: requestHeaders,
    body: {
      organizationId: organizations[0].id,
    },
  })

  return {
    ...session,
    session: {
      ...session.session,
      activeOrganizationId: organizations[0].id,
    },
  }
}