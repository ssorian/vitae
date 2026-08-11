import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { auth } from '#/infrastructure/auth/auth'
import { getDoctorResult } from '#/modules/order/services/results'
import { ResultFiles } from './ResultFiles'

type ResultPageProps = { params: Promise<{ orderId: string }> }

export default async function ResultPage({ params }: ResultPageProps) {
  const { orderId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/login?redirect=${encodeURIComponent(`/portal/results/${orderId}`)}`)

  const order = await getDoctorResult(orderId, session.user.email)
  if (!order) notFound()
  const result = order.results[0]

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <p className="text-sm text-zinc-500">Folio {order.folio}</p>
        <h1 className="text-2xl font-semibold">Resultados del estudio</h1>
      </header>
      <section className="rounded border p-4">
        <h2 className="font-medium">Observaciones</h2>
        <p className="mt-2 whitespace-pre-wrap text-zinc-700">{result.observations || 'Sin observaciones.'}</p>
        {result.realizedAt && <p className="mt-3 text-sm text-zinc-500">Realizado: {new Date(result.realizedAt).toLocaleDateString('es-MX')}</p>}
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">Archivos</h2>
        <ResultFiles orderId={order.id} assets={order.assets.map(({ id, name, type }) => ({ id, name, type }))} />
      </section>
    </main>
  )
}
