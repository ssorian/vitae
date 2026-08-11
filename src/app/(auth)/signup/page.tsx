
import { AuthLayout } from '#/modules/auth/components/layout'
import { SignupForm } from '#/modules/auth/components/Signup'

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm redirectTo="/org" />
    </AuthLayout>
  )
}

