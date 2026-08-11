import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { auth } from '#/infrastructure/auth/auth'
import { getDoctorAssetUrl } from '#/modules/order/services/results'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ orderId: string; assetId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const { orderId, assetId } = await context.params
  try {
    const signedUrl = await getDoctorAssetUrl(orderId, assetId, session.user.email)
    if (!signedUrl) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ signedUrl })
  } catch {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}
