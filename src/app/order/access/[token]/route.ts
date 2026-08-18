import { NextRequest, NextResponse } from 'next/server'

import { grantCookieValue, resultSessionExpiresAt } from '#/modules/order/resultAccess'
import { getGrantedOrderBySecret } from '#/modules/order/services/results'

export const runtime = 'nodejs'
type Context = { params: Promise<{ token: string }> }

export async function GET(request: NextRequest, context: Context) {
  const { token } = await context.params
  try {
    const grant = await getGrantedOrderBySecret(token)
    if (!grant) return NextResponse.redirect(new URL('/order?error=1', request.url), 303)
    const response = NextResponse.redirect(new URL(`/order/results/${grant.order.id}`, request.url), 303)
    response.cookies.set('vitae_order_result', grantCookieValue(grant.order.id, grant.grant.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: resultSessionExpiresAt() })
    return response
  } catch { return NextResponse.redirect(new URL('/order?error=1', request.url), 303) }
}
