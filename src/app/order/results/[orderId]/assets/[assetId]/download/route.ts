import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { parseGrantCookie, resultGrantCookieName } from '#/modules/order/resultAccess'
import { getGrantedAssetDownload } from '#/modules/order/services/results'

export const runtime = 'nodejs'

const privateHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' }

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string; assetId: string }> }) {
  const { orderId, assetId } = await params
  const grant = parseGrantCookie((await cookies()).get(resultGrantCookieName)?.value)
  if (!grant || grant.orderId !== orderId) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: privateHeaders })
  try {
    const download = await getGrantedAssetDownload(orderId, grant.grantId, assetId)
    if (!download) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: privateHeaders })
    return new NextResponse(download.body, { headers: { ...privateHeaders, 'Content-Disposition': `attachment; filename="${download.name}"`, 'Content-Type': download.contentType } })
  } catch { return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: privateHeaders }) }
}
