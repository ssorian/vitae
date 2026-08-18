import { notFound } from 'next/navigation'

import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { OrderDetail } from '#/modules/order/OrderDetail'
import { matchesClinicOrder } from '#/modules/order/clinicOrder'
import { getOrderDetailsAction } from '#/modules/order/server/generalOrder'

export default async function ClinicOrderDetailPage({ params }: { params: Promise<{ clinicId: string; orderId: string }> }) {
  const { clinicId, orderId } = await params
  const { clinic } = await requireClinicAccess(clinicId)
  if (!clinic.laboratoryEnabled) notFound()

  const order = await getOrderDetailsAction(orderId)
  if (!matchesClinicOrder(clinic.id, order)) notFound()

  const ordersPath = `/clinics/${clinic.id}/orders`
  return <OrderDetail orderId={orderId} ordersPath={ordersPath} viewerPath={`${ordersPath}/${orderId}/viewer`} />
}
