'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { authClient } from '#/infrastructure/auth/auth-client'
import { Button } from '#/shared/components/ui/button'
import { Card, CardContent } from '#/shared/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/shared/components/ui/field'
import { Input } from '#/shared/components/ui/input'

type LoginFormProps = {
  redirectTo?: string
}

export function LoginForm({
  redirectTo = '/org',
}: LoginFormProps) {
  const router = useRouter()

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setIsPending(true)

    const formData = new FormData(event.currentTarget)

    try {
      const result = await authClient.signIn.email({
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
      })

      if (result.error) {
        setError('Unable to sign in. Check your details and try again.')
        return
      }

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError('Unable to sign in. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div>
              <h1 className="text-2xl font-semibold">
                Welcome back
              </h1>
              <p className="text-muted-foreground">
                Sign in to your account.
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor="email">
                Email
              </FieldLabel>

              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">
                Password
              </FieldLabel>

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isPending}
              />
            </Field>

            {error ? (
              <FieldError>{error}</FieldError>
            ) : null}

            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>

            <FieldDescription>
              Don't have an account? Sign up
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
