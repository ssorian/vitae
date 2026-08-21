import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { parseGrantCookie, resultGrantCookieName } from '#/modules/order/resultAccess'
import { getGrantedAssetDownload, getGrantedAssetsArchive, getGrantedOrder } from '#/modules/order/services/results'

export const runtime = 'nodejs'

const privateHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' }

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const grant = parseGrantCookie((await cookies()).get(resultGrantCookieName)?.value)
  if (!grant || grant.orderId !== orderId) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: privateHeaders })
  try {
    const found = await getGrantedOrder(orderId, grant.grantId)
    if (!found?.assets.length) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: privateHeaders })
    if (found.assets.length === 1) {
      const download = await getGrantedAssetDownload(orderId, grant.grantId, found.assets[0].id)
      if (!download) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: privateHeaders })
      return new NextResponse(download.body, { headers: { ...privateHeaders, 'Content-Disposition': `attachment; filename="${download.name}"`, 'Content-Type': download.contentType } })
    }
    const archive = await getGrantedAssetsArchive(orderId, grant.grantId)
    if (!archive) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: privateHeaders })
    return new NextResponse(archive.body, { headers: { ...privateHeaders, 'Content-Disposition': `attachment; filename="${archive.name}"`, 'Content-Type': 'application/zip' } })
  } catch { return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: privateHeaders }) }
}
