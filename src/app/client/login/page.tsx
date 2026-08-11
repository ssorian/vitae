'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function ClientLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)
    setIsPending(true)

    const { error } = await authClient.signIn.email({
      email,
      password,
    })

    setIsPending(false)

    if (error) {
      setError(
        error.message ??
          'No fue posible iniciar sesión.',
      )

      return
    }

    router.replace('/client')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Portal para doctores
          </CardTitle>

          <CardDescription>
            Inicia sesión para consultar y administrar tus
            órdenes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
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
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
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
                ? 'Iniciando sesión...'
                : 'Iniciar sesión'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Aún no tienes una cuenta?{' '}
              <Link
                href="/client/sign-up"
                className="font-medium text-primary hover:underline"
              >
                Crear cuenta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}