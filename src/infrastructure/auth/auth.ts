import { betterAuth } from 'better-auth'
import { organization, username } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import { env } from '#/config/env'
import { db } from '#/infrastructure/database/index'

import * as schema from './db/schema'


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
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [organization(), username()],
})
