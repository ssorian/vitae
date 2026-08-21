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

type SignupFormProps = { redirectTo?: string }

export function SignupForm({ redirectTo = '/appointments' }: SignupFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsPending(true)
    const formData = new FormData(event.currentTarget)
    try {
      const result = await authClient.signUp.email({ name: String(formData.get('name') ?? ''), email: String(formData.get('email') ?? ''), password: String(formData.get('password') ?? '') })
      if (result.error) { setError('No fue posible crear tu cuenta. Intenta de nuevo.'); return }
      await associateCurrentUserAction().catch(() => undefined)
      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError('No fue posible crear tu cuenta. Intenta de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  async function handleGoogleSignUp() {
    setError(null)
    setIsPending(true)
    try {
      const callbackURL = await beginGoogleDoctorAssociationFlow()
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: `${callbackURL}&redirect=${encodeURIComponent(redirectTo)}` })
      if (result.error) setError('No fue posible continuar con Google. Intenta de nuevo.')
    } catch {
      setError('No fue posible continuar con Google. Intenta de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return <Card><CardContent><form onSubmit={handleSubmit}><FieldGroup><div><h1 className="text-2xl font-semibold">Crea tu cuenta</h1><p className="text-muted-foreground">Úsala para consultar y agendar tu atención.</p></div><Field><FieldLabel htmlFor="name">Nombre completo</FieldLabel><Input id="name" name="name" type="text" autoComplete="name" required disabled={isPending} /></Field><Field><FieldLabel htmlFor="email">Correo</FieldLabel><Input id="email" name="email" type="email" autoComplete="email" required disabled={isPending} /></Field><Field><FieldLabel htmlFor="password">Contraseña</FieldLabel><Input id="password" name="password" type="password" autoComplete="new-password" required disabled={isPending} /></Field>{error ? <FieldError>{error}</FieldError> : null}<Button type="submit" disabled={isPending}>{isPending ? 'Creando cuenta…' : 'Crear cuenta'}</Button><Button type="button" variant="outline" disabled={isPending} onClick={handleGoogleSignUp}>Continuar con Google</Button><FieldDescription>¿Ya tienes una cuenta? Inicia sesión</FieldDescription></FieldGroup></form></CardContent></Card>
}
