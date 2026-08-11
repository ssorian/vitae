import { z } from 'zod'

import { AuthLayout } from '#/modules/auth/components/layout'
import { LoginForm } from '#/modules/auth/components/Login'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

type LoginPageProps = {
  searchParams: Promise<{
    redirect?: string
  }>
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const parsed = loginSearchSchema.safeParse(await searchParams)

  const redirect = parsed.success
    ? parsed.data.redirect
    : undefined

  const destination = getLocalRedirect(redirect)

  return (
    <AuthLayout>
      <LoginForm redirectTo={destination} />
    </AuthLayout>
  )
}

function getLocalRedirect(redirect: string | undefined) {
  if (
    redirect &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !redirect.includes('\\')
  ) {
    return redirect
  }

  return '/org'
}