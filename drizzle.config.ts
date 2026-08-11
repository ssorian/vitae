import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

import { env } from './src/config/env'

config({ path: ['.env.local', '.env'] })

export default defineConfig({
  out: './drizzle',
  schema: './src/infrastructure/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
