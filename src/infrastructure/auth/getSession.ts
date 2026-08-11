import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from './auth'

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

export const requireSession = cache(async () => {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
})