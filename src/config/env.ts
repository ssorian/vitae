import { config } from 'dotenv'
import { z } from 'zod'

export const serverEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.url(),
})

function parseServerEnv(input: Record<string, string | undefined>) {
  return serverEnvSchema.parse(input)
}

function getEnv() {
  config({ path: '.env.local' })
  config({ path: '.env' })
  return parseServerEnv(process.env)
}

export const env = getEnv()


