import { NextResponse } from 'next/server'

import { hasValidPatientResultAssetParams } from '#/modules/patient/profile'
import { requirePatientOwnership } from '#/modules/patient/requirePatientOwnership'
import { getOwnedPatientAssetUrl } from '#/modules/patient/server/results'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ patientId: string; orderId: string; assetId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params
  if (!hasValidPatientResultAssetParams(params)) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  try {
    const ownership = await requirePatientOwnership()
    const signedUrl = await getOwnedPatientAssetUrl(params.patientId, ownership.patientId, params.orderId, params.assetId)
    if (!signedUrl) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.redirect(signedUrl)
  } catch {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}
