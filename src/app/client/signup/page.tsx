'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '#/infrastructure/auth/auth-client'

import { Button } from '#/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'

function localRedirect(value: string | null, fallback: string) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    ? value
    : fallback
}

export default function ClientSignUpPage() {
  return <Suspense fallback={null}><ClientSignUpPageContent /></Suspense>
}

function ClientSignUpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = localRedirect(searchParams.get('redirect'), '/client/onboarding')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] =
    useState('')

  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsPending(true)

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    })

    setIsPending(false)

    if (error) {
      setError(
        error.message ??
          'No fue posible crear la cuenta.',
      )

      return
    }

    router.replace(redirect)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Crear cuenta
          </CardTitle>

          <CardDescription>
            Regístrate para solicitar y consultar tus órdenes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre
              </Label>

              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Correo electrónico
              </Label>

              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="doctor@ejemplo.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña
              </Label>

              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation">
                Confirmar contraseña
              </Label>

              <Input
                id="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(
                    event.target.value,
                  )
                }
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending
                ? 'Creando cuenta...'
                : 'Crear cuenta'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href={`/client/login?redirect=${encodeURIComponent(redirect)}`}
                className="font-medium text-primary hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}