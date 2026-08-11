import 'server-only'

import { headers } from 'next/headers'

import { auth } from '#/infrastructure/auth/auth'

export async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    throw new Error('UNAUTHORIZED')
  }

  return session.user
}