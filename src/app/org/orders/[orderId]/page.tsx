'use client'

import { useParams } from 'next/navigation'

import { OrderDetail } from '#/modules/order/OrderDetail'

export default function OrgOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  return <OrderDetail orderId={orderId} ordersPath="/org/orders" viewerPath={`/org/orders/${orderId}/viewer`} />
}
