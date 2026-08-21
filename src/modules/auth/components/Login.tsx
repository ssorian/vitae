'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { authClient } from '#/infrastructure/auth/auth-client'
import { beginGoogleDoctorAssociationFlow } from '#/modules/client/server/association'
import { associateCurrentUserAction } from '#/modules/patient/server/association'
import { Button } from '#/shared/components/ui/button'
import { Card, CardContent } from '#/shared/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '#/shared/components/ui/field'
import { Input } from '#/shared/components/ui/input'

type LoginFormProps = { redirectTo?: string }

export function LoginForm({ redirectTo = '/appointments' }: LoginFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)
    const formData = new FormData(event.currentTarget)
    try {
      const result = await authClient.signIn.email({ email: String(formData.get('email') ?? ''), password: String(formData.get('password') ?? '') })
      if (result.error) { setError('No fue posible iniciar sesión. Revisa tus datos e intenta de nuevo.'); return }
      await associateCurrentUserAction().catch(() => undefined)
      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError('No fue posible iniciar sesión. Intenta de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setIsPending(true)
    try {
      const callbackURL = await beginGoogleDoctorAssociationFlow()
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: `${callbackURL}&redirect=${encodeURIComponent(redirectTo)}` })
      if (result.error) setError('No fue posible iniciar sesión con Google. Intenta de nuevo.')
    } catch {
      setError('No fue posible iniciar sesión con Google. Intenta de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return <Card><CardContent><form onSubmit={handleSubmit}><FieldGroup><div><h1 className="text-2xl font-semibold">Bienvenido</h1><p className="text-muted-foreground">Inicia sesión para continuar.</p></div><Field><FieldLabel htmlFor="email">Correo</FieldLabel><Input id="email" name="email" type="email" autoComplete="email" required disabled={isPending} /></Field><Field><FieldLabel htmlFor="password">Contraseña</FieldLabel><Input id="password" name="password" type="password" autoComplete="current-password" required disabled={isPending} /></Field>{error ? <FieldError>{error}</FieldError> : null}<Button type="submit" disabled={isPending}>{isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}</Button><Button type="button" variant="outline" disabled={isPending} onClick={handleGoogleSignIn}>Continuar con Google</Button><FieldDescription>¿No tienes una cuenta? Regístrate</FieldDescription></FieldGroup></form></CardContent></Card>
}
