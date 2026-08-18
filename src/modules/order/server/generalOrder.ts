'use server'

import { createOrderSchema } from '#/modules/order/schemas/generalOrder'
import { createOrder, findOrganization, listOrders, getOrderDetails, updateOrderStatus } from '#/modules/order/services/generalOrder'
import { deliverOrderResults } from '#/modules/order/services/results'
import { listClinics } from '#/modules/clinic/services/clinic'
import { requireOrganization } from '#/infrastructure/auth/requireOrganization'
import { appointmentAccess } from '#/modules/appointment/services/appointment'
import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'

async function operationalAccess(clinicId?: string) {
  const context = await requireOrganization()
  const access = await appointmentAccess(context.organizationId, context.user.id)
  if (!access.active || !['owner', 'assistant'].includes(access.role)) throw new Error('FORBIDDEN')
  if (clinicId) {
    const scope = await requireClinicAccess(clinicId)
    if (!scope.clinic.laboratoryEnabled) throw new Error('LABORATORY_DISABLED')
    return { ...context, access, clinicId }
  }
  if (access.role === 'assistant') {
    if (!access.assignedClinicId) throw new Error('FORBIDDEN')
    const scope = await requireClinicAccess(access.assignedClinicId)
    if (!scope.clinic.laboratoryEnabled) throw new Error('LABORATORY_DISABLED')
    return { ...context, access, clinicId: access.assignedClinicId }
  }
  return { ...context, access, clinicId: undefined }
}

export async function createPublicOrderAction(values: unknown) {
  const parsed = createOrderSchema.safeParse(values)
  if (!parsed.success) return { success: false as const, error: 'INVALID_INPUT', issues: parsed.error.flatten() }
  const org = await findOrganization()
  if (!org) return { success: false as const, error: 'ORGANIZATION_NOT_FOUND' }
  const clinics = await listClinics(org.id)
  if (!clinics.some((clinic) => clinic.id === parsed.data.clinicId && clinic.laboratoryEnabled)) return { success: false as const, error: 'LABORATORY_DISABLED' }
  const result = await createOrder({ organizationId: org.id, userId: null, source: 'public', data: parsed.data })
  return { success: true as const, data: { orderId: result.order.id, folio: result.order.folio } }
}

export async function getPublicClinicsAction() { const org = await findOrganization(); if (!org) throw new Error('ORGANIZATION_NOT_FOUND'); return (await listClinics(org.id)).filter((clinic) => clinic.laboratoryEnabled && clinic.status === 'active') }
export async function createInternalOrderAction(values: unknown) { const parsed = createOrderSchema.safeParse(values); if (!parsed.success) return { success: false as const, error: 'INVALID_INPUT', issues: parsed.error.flatten() }; const context = await operationalAccess(parsed.data.clinicId); const result = await createOrder({ organizationId: context.organizationId, userId: context.user.id, source: 'internal', data: parsed.data }); return { success: true as const, data: { orderId: result.order.id, folio: result.order.folio } } }
export async function listOrdersAction(clinicId?: string) { const context = await operationalAccess(clinicId); return listOrders(context.organizationId, context.clinicId) }
export async function getOrderDetailsAction(orderId: string) { const { organizationId } = await requireOrganization(); const result = await getOrderDetails(organizationId, orderId); if (!result) return null; await operationalAccess(result.clinicId); return result }
export async function updateOrderStatusAction(orderId: string, status: 'draft' | 'received' | 'scheduled' | 'in_progress' | 'ready' | 'delivered' | 'cancelled') { const { organizationId, user } = await requireOrganization(); const order = await getOrderDetails(organizationId, orderId); if (!order) throw new Error('ORDER_NOT_FOUND'); await operationalAccess(order.clinicId); return updateOrderStatus(organizationId, orderId, status, user.id) }
export async function deliverOrderResultsAction(orderId: string) { const { organizationId, user } = await requireOrganization(); const order = await getOrderDetails(organizationId, orderId); if (!order) throw new Error('ORDER_NOT_FOUND'); await operationalAccess(order.clinicId); return deliverOrderResults(organizationId, orderId, user.id) }
