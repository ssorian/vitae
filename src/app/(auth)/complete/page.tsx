'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { associateCurrentGoogleUserWithDoctorClientAction } from '#/modules/client/server/association'
import { associateCurrentUserAction } from '#/modules/patient/server/association'

function localRedirect(redirect: string | null) {
  return redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('\\') ? redirect : '/appointments'
}

function AuthComplete() {
  const router = useRouter()
  const searchParams = useSearchParams()
  useEffect(() => {
    void Promise.allSettled([
      associateCurrentUserAction(),
      associateCurrentGoogleUserWithDoctorClientAction(searchParams.get('googleIntent')),
    ]).finally(() => {
      router.replace(localRedirect(searchParams.get('redirect')))
      router.refresh()
    })
  }, [router, searchParams])

  return <p role="status">Estamos preparando tu cuenta…</p>
}

export default function AuthCompletePage() {
  return <main className="flex min-h-svh items-center justify-center p-6"><Suspense fallback={<p role="status">Estamos preparando tu cuenta…</p>}><AuthComplete /></Suspense></main>
}
