import { PortalActivationForm } from '#/modules/patient/PortalActivationForm'

export default async function PortalActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) return <main className="mx-auto max-w-md p-6"><p role="alert">Falta el enlace de activación.</p></main>

  return <main className="mx-auto max-w-md p-6"><h1 className="text-2xl font-semibold">Activá tu cuenta</h1><p className="mt-2 mb-6 text-sm text-muted-foreground">Elegí un usuario y contraseña para consultar tu información cuando el portal esté disponible.</p><PortalActivationForm token={token} /></main>
}
