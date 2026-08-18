import { NextRequest, NextResponse } from 'next/server'

import { allowResultAccessAttempt, grantCookieValue, resultSessionExpiresAt } from '#/modules/order/resultAccess'
import { getGrantedOrderByFolioCode } from '#/modules/order/services/results'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const folio = typeof form.get('folio') === 'string' ? form.get('folio') as string : ''
  const code = typeof form.get('code') === 'string' ? form.get('code') as string : ''
  const key = `${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'}:${folio.trim().toUpperCase()}`
  if (!allowResultAccessAttempt(key) || !folio || !code) return NextResponse.redirect(new URL('/order?error=1', request.url), 303)
  try {
    const grant = await getGrantedOrderByFolioCode(folio, code)
    if (!grant) return NextResponse.redirect(new URL('/order?error=1', request.url), 303)
    const response = NextResponse.redirect(new URL(`/order/results/${grant.order.id}`, request.url), 303)
    response.cookies.set('vitae_order_result', grantCookieValue(grant.order.id, grant.grant.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: resultSessionExpiresAt() })
    return response
  } catch { return NextResponse.redirect(new URL('/order?error=1', request.url), 303) }
}
