import { notFound } from 'next/navigation'

import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { matchesClinicOrder } from '#/modules/order/clinicOrder'
import { getOrderDetailsAction } from '#/modules/order/server/generalOrder'
import { getOrganizationViewerAssets } from '#/modules/order/services/results'
import { Viewer } from '#/modules/viewer'

export default async function ClinicOrderViewerPage({ params }: { params: Promise<{ clinicId: string; orderId: string }> }) {
  const { clinicId, orderId } = await params
  const { clinic, organizationId } = await requireClinicAccess(clinicId)
  if (!clinic.laboratoryEnabled) notFound()

  const order = await getOrderDetailsAction(orderId)
  if (!matchesClinicOrder(clinic.id, order)) notFound()

  const study = await getOrganizationViewerAssets(organizationId, orderId)
  if (!study?.assets.length) notFound()
  return <main className="mx-auto max-w-7xl space-y-4 p-6"><h1 className="text-2xl font-semibold">Visor de estudio</h1><Viewer type={study.type} assets={study.assets} /></main>
}
