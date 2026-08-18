import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { parseGrantCookie, resultGrantCookieName } from '#/modules/order/resultAccess'
import { getGrantedOrder } from '#/modules/order/services/results'

export default async function GuestResultPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const grant = parseGrantCookie((await cookies()).get(resultGrantCookieName)?.value)
  if (!grant || grant.orderId !== orderId) notFound()
  const found = await getGrantedOrder(orderId, grant.grantId)
  if (!found) notFound()
  const result = found.results[0]
  return <main className="mx-auto max-w-3xl space-y-6 p-6"><header><p className="text-sm text-zinc-500">Folio {found.folio}</p><h1 className="text-2xl font-semibold">Resultados del estudio</h1></header><section className="rounded border p-4"><h2 className="font-medium">Observaciones</h2><p className="mt-2 whitespace-pre-wrap">{result.observations || 'Sin observaciones.'}</p></section><section><h2 className="font-medium">Archivos</h2><ul className="mt-3 space-y-2">{found.assets.map((asset) => <li key={asset.id} className="flex justify-between rounded border p-3"><span>{asset.name} ({asset.type.toUpperCase()})</span><a className="text-primary underline" href={`/order/results/${orderId}/assets/${asset.id}`}>Abrir archivo</a></li>)}</ul></section></main>
}
