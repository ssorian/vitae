import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

import { parseGrantCookie, resultGrantCookieName } from '#/modules/order/resultAccess'
import { getGrantedViewerAssets } from '#/modules/order/services/results'
import { Viewer } from '#/modules/viewer'

export default async function GuestResultViewerPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const grant = parseGrantCookie((await cookies()).get(resultGrantCookieName)?.value)
  if (!grant || grant.orderId !== orderId) notFound()
  const study = await getGrantedViewerAssets(orderId, grant.grantId)
  if (!study) notFound()

  return <main className="mx-auto max-w-7xl space-y-4 p-6"><meta name="referrer" content="no-referrer" /><h1 className="text-2xl font-semibold">Visor de estudio</h1><Viewer type={study.type} assets={study.assets} /></main>
}
