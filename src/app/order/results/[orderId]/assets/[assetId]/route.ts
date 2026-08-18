import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { parseGrantCookie, resultGrantCookieName } from '#/modules/order/resultAccess'
import { getGrantedAssetUrl } from '#/modules/order/services/results'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string; assetId: string }> }) {
  const { orderId, assetId } = await params
  const grant = parseGrantCookie((await cookies()).get(resultGrantCookieName)?.value)
  if (!grant || grant.orderId !== orderId) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  try {
    const url = await getGrantedAssetUrl(orderId, grant.grantId, assetId)
    return url ? NextResponse.redirect(url) : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  } catch { return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 }) }
}
