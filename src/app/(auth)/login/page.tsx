import { z } from 'zod'

import { AuthLayout } from '#/modules/auth/components/layout'
import { LoginForm } from '#/modules/auth/components/Login'

const loginSearchSchema = z.object({ redirect: z.string().optional() })

type LoginPageProps = { searchParams: Promise<{ redirect?: string }> }

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const parsed = loginSearchSchema.safeParse(await searchParams)
  const redirect = parsed.success ? parsed.data.redirect : undefined
  return <AuthLayout><LoginForm redirectTo={getLocalRedirect(redirect)} /></AuthLayout>
}

function getLocalRedirect(redirect: string | undefined) {
  return redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('\\') ? redirect : '/appointments'
}
