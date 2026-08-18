import { NextRequest, NextResponse } from 'next/server'

import { requireOrganization } from '#/infrastructure/auth/requireOrganization'
import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { uploadOrderResult } from '#/modules/order/services/results'
import { getOrderDetails } from '#/modules/order/services/generalOrder'
import { appointmentAccess } from '#/modules/appointment/services/appointment'

export const runtime = 'nodejs'
type RouteContext = { params: Promise<{ orderId: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { user, organizationId } = await requireOrganization()
    const access = await appointmentAccess(organizationId, user.id)
    if (!['owner', 'assistant'].includes(access.role) || !access.active) throw new Error('FORBIDDEN')
    const { orderId } = await context.params
    const order = await getOrderDetails(organizationId, orderId)
    if (!order) throw new Error('ORDER_NOT_FOUND')
    const scope = await requireClinicAccess(order.clinicId)
    if (!scope.clinic.laboratoryEnabled) throw new Error('LABORATORY_DISABLED')
    const formData = await request.formData()
    const observations = formData.get('observations')
    const realizedAt = formData.get('realizedAt')
    const files = formData.getAll('files').filter((value): value is File => value instanceof File)
    if (typeof observations !== 'string' || typeof realizedAt !== 'string' || Number.isNaN(new Date(realizedAt).getTime())) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    await uploadOrderResult(organizationId, user.id, { orderId, observations, realizedAt: new Date(realizedAt), files })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RESULT_UPLOAD_FAILED'
    return NextResponse.json({ error: message }, { status: message === 'UNAUTHORIZED' || message === 'ORGANIZATION_REQUIRED' ? 401 : 400 })
  }
}
