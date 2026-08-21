import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

import { parseGrantCookie, resultGrantCookieName } from '#/modules/order/resultAccess'
import { getGrantedOrder } from '#/modules/order/services/results'

export default async function GuestResultPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const grant = parseGrantCookie((await cookies()).get(resultGrantCookieName)?.value)
  if (!grant || grant.orderId !== orderId) notFound()
  const found = await getGrantedOrder(orderId, grant.grantId)
  if (!found) notFound()
  const result = found.results[0]
  const hasViewerAssets = found.assets.some((asset) => asset.type === 'dicom')
  return <main className="mx-auto max-w-3xl space-y-6 p-6"><meta name="referrer" content="no-referrer" /><header><p className="text-sm text-zinc-500">Folio {found.folio}</p><h1 className="text-2xl font-semibold">Resultados del estudio</h1></header><section className="rounded border p-4"><h2 className="font-medium">Observaciones</h2><p className="mt-2 whitespace-pre-wrap">{result.observations || 'Sin observaciones.'}</p></section>{hasViewerAssets && <a className="inline-block text-primary underline" href={`/order/results/${orderId}/viewer`}>Abrir visor</a>}<section><div className="flex items-center justify-between"><h2 className="font-medium">Archivos</h2><a className="text-primary underline" href={`/order/results/${orderId}/download`}>{found.assets.length === 1 ? 'Descargar archivo' : 'Descargar todos (.zip)'}</a></div><ul className="mt-3 space-y-2">{found.assets.map((asset) => <li key={asset.id} className="flex justify-between rounded border p-3"><span>{asset.name} ({asset.type.toUpperCase()})</span><a className="text-primary underline" href={`/order/results/${orderId}/assets/${asset.id}/download`}>Descargar</a></li>)}</ul></section></main>
}
