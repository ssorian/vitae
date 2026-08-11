import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import { env } from '#/config/env'
import { db } from '#/infrastructure/database/index'

import * as schema from './db/schema'

export function organizationSlug(name: string) {
  const base =
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 240) || 'clinic'

  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

let createOrganizationForUser: (user: {
  id: string
  name: string
}) => Promise<void> = async () => {
  throw new Error('Organization creation is not initialized')
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => createOrganizationForUser(user),
      },
    },
  },
  plugins: [organization()],
})

createOrganizationForUser = async (user) => {
  await auth.api.createOrganization({
    body: {
      name: `${user.name.trim() || 'Clinic'} Clinic`,
      slug: organizationSlug(user.name),
      userId: user.id,
    },
  })
}
