'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { authClient } from '#/infrastructure/auth/auth-client'
import { Button } from '#/shared/components/ui/button'
import { activatePatientPortalAction } from './server/portal'

export function PortalActivationForm({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '')
    const password = String(form.get('password') ?? '')
    setError('')
    setPending(true)
    try {
      const activation = await activatePatientPortalAction({ token, username, password })
      const result = await authClient.signIn.username({ username, password })
      if (result.error) { setError('Cuenta activada. Iniciá sesión con tu usuario y contraseña.'); return }
      router.replace(`/patient/${activation.patientId}`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'INVITATION_INVALID'
        ? 'Este enlace no es válido o ya venció.'
        : cause instanceof Error && cause.message === 'PATIENT_ACCOUNT_EXISTS'
          ? 'Esta cuenta de paciente ya fue activada.'
          : 'No se pudo activar la cuenta. Revisá los datos e intentá de nuevo.')
    } finally {
      setPending(false)
    }
  }

  return <form className="grid gap-4" onSubmit={submit}>
    <label className="grid gap-1 text-sm font-medium">Usuario<input className="h-9 rounded-md border bg-background px-3" name="username" autoComplete="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9_.]+" required disabled={pending} /></label>
    <label className="grid gap-1 text-sm font-medium">Contraseña<input className="h-9 rounded-md border bg-background px-3" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={pending} /></label>
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? 'Activando…' : 'Activar cuenta'}</Button>
  </form>
}
