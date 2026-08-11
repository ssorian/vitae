import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { auth } from '#/infrastructure/auth/auth'
import { getDoctorViewerAssets } from '#/modules/order/services/results'
import { Viewer } from '#/modules/viewer'

type ViewerPageProps = { params: Promise<{ orderId: string }> }

export default async function PortalResultViewerPage({ params }: ViewerPageProps) {
  const { orderId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/login?redirect=${encodeURIComponent(`/portal/results/${orderId}/viewer`)}`)

  const study = await getDoctorViewerAssets(orderId, session.user.email)
  if (!study?.assets.length) notFound()

  return <main className="mx-auto max-w-7xl space-y-4 p-6"><h1 className="text-2xl font-semibold">Visor de estudio</h1><Viewer type={study.type} assets={study.assets} /></main>
}
