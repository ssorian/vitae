import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { parseGrantCookie, resultGrantCookieName } from '#/modules/order/resultAccess'
import { getGrantedAssetUrl } from '#/modules/order/services/results'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string; assetId: string }> }) {
  const { orderId, assetId } = await params
  const grant = parseGrantCookie((await cookies()).get(resultGrantCookieName)?.value)
  if (!grant || grant.orderId !== orderId) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
  try {
    const url = await getGrantedAssetUrl(orderId, grant.grantId, assetId)
    if (!url) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  } catch { return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }) }
}
