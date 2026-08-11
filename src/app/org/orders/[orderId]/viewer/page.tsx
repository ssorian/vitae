import { notFound } from 'next/navigation'

import { requireOrganization } from '#/infrastructure/auth/requireOrganization'
import { getOrganizationViewerAssets } from '#/modules/order/services/results'
import { Viewer } from '#/modules/viewer'

type ViewerPageProps = { params: Promise<{ orderId: string }> }

export default async function OrgOrderViewerPage({ params }: ViewerPageProps) {
  const { orderId } = await params
  const { organizationId } = await requireOrganization()
  const study = await getOrganizationViewerAssets(organizationId, orderId)
  if (!study?.assets.length) notFound()

  return <main className="mx-auto max-w-7xl space-y-4 p-6"><h1 className="text-2xl font-semibold">Visor de estudio</h1><Viewer type={study.type} assets={study.assets} /></main>
}
