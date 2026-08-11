'use server'

import { createOrderSchema } from '#/modules/order/schemas/generalOrder'
import {
  createOrder,
  findOrganization,
  listOrders,
  getOrderDetails,
  updateOrderStatus,
} from '#/modules/order/services/generalOrder'
import { deliverOrderResults } from '#/modules/order/services/results'
import { listClinics } from '#/modules/clinic/services/clinic'
import { requireOrganization } from '#/infrastructure/auth/requireOrganization'
import { appointmentAccess } from '#/modules/appointment/services/appointment'

export async function createPublicOrderAction(values: unknown) {
  const parsed = createOrderSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false as const, error: 'INVALID_INPUT', issues: parsed.error.flatten() }
  }

  const org = await findOrganization()
  if (!org) return { success: false as const, error: 'ORGANIZATION_NOT_FOUND' }

  const result = await createOrder({ organizationId: org.id, userId: null, source: 'public', data: parsed.data })
  return { success: true as const, data: { orderId: result.order.id, folio: result.order.folio } }
}

export async function getPublicClinicsAction() {
  const org = await findOrganization()
  if (!org) throw new Error('ORGANIZATION_NOT_FOUND')
  return listClinics(org.id)
}

export async function createInternalOrderAction(values: unknown) {
  const { user, organizationId } = await requireOrganization()
  const parsed = createOrderSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false as const, error: 'INVALID_INPUT', issues: parsed.error.flatten() }
  }

  const result = await createOrder({ organizationId, userId: user.id, source: 'internal', data: parsed.data })
  return { success: true as const, data: { orderId: result.order.id, folio: result.order.folio } }
}

export async function listOrdersAction() {
  const { organizationId } = await requireOrganization()
  return listOrders(organizationId)
}

export async function getOrderDetailsAction(orderId: string) {
  const { organizationId } = await requireOrganization()
  return getOrderDetails(organizationId, orderId)
}

export async function updateOrderStatusAction(
  orderId: string,
  status: 'draft' | 'received' | 'scheduled' | 'in_progress' | 'ready' | 'delivered' | 'cancelled',
) {
  const { user, organizationId } = await requireOrganization()
  const access = await appointmentAccess(organizationId, user.id)
  if (!['owner', 'assistant'].includes(access.role)) throw new Error('FORBIDDEN')
  return updateOrderStatus(organizationId, orderId, status, user.id)
}

export async function deliverOrderResultsAction(orderId: string) {
  const { user, organizationId } = await requireOrganization()
  const access = await appointmentAccess(organizationId, user.id)
  if (!['owner', 'assistant'].includes(access.role)) throw new Error('FORBIDDEN')
  return deliverOrderResults(organizationId, orderId, user.id)
}
