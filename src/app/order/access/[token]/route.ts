import { NextRequest, NextResponse } from 'next/server'

import { grantCookieValue, resultSessionExpiresAt } from '#/modules/order/resultAccess'
import { getGrantedOrderBySecret } from '#/modules/order/services/results'

export const runtime = 'nodejs'
type Context = { params: Promise<{ token: string }> }

function privateRedirect(path: string, request: NextRequest) {
  const response = NextResponse.redirect(new URL(path, request.url), 303)
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}

export async function GET(request: NextRequest, context: Context) {
  const { token } = await context.params
  try {
    const grant = await getGrantedOrderBySecret(token)
    if (!grant) return privateRedirect('/order?error=1', request)
    const destination = request.nextUrl.searchParams.get('destination')
    const path = destination === 'download'
      ? `/order/results/${grant.order.id}/download`
      : destination === 'viewer'
        ? `/order/results/${grant.order.id}/viewer`
        : `/order/results/${grant.order.id}`
    const response = privateRedirect(path, request)
    response.cookies.set('vitae_order_result', grantCookieValue(grant.order.id, grant.grant.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: resultSessionExpiresAt() })
    return response
  } catch { return privateRedirect('/order?error=1', request) }
}
