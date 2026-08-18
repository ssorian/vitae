import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const resultGrantLifetimeMs = 72 * 60 * 60 * 1000
export const resultSessionLifetimeMs = 15 * 60 * 1000
export const resultGrantCookieName = 'vitae_order_result'

export function createResultGrantToken() { return randomBytes(32).toString('base64url') }
export function createResultAccessCode() { return randomBytes(6).toString('base64url').toUpperCase() }
export function hashResultAccessSecret(secret: string) { return createHash('sha256').update(secret).digest('hex') }
export function resultGrantExpiresAt(now = new Date()) { return new Date(now.getTime() + resultGrantLifetimeMs) }
export function resultSessionExpiresAt(now = new Date()) { return new Date(now.getTime() + resultSessionLifetimeMs) }

export function hasUsableResultGrant(grant: { expiresAt: Date; revokedAt: Date | null }, now = new Date()) {
  return grant.revokedAt === null && grant.expiresAt > now
}

export function secureSecretMatches(secret: string, hash: string) {
  const actual = Buffer.from(hashResultAccessSecret(secret), 'hex')
  const expected = Buffer.from(hash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function selectResultDeliveryTarget(input: { patientId: string; patientEmail: string | null; account: { verifiedAt: Date | null; revokedAt: Date | null } | null }) {
  const email = input.patientEmail?.trim().toLowerCase()
  const deliverableEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith('.invalid') ? email : null
  if (input.account?.verifiedAt && !input.account.revokedAt && deliverableEmail) return { kind: 'account' as const, patientId: input.patientId, email: deliverableEmail }
  if (deliverableEmail) return { kind: 'email' as const, email: deliverableEmail }
  return { kind: 'code' as const }
}

export function grantCookieValue(orderId: string, grantId: string) { return `${orderId}.${grantId}` }
export function parseGrantCookie(value: string | undefined) {
  const [orderId, grantId, ...rest] = value?.split('.') ?? []
  return orderId && grantId && rest.length === 0 ? { orderId, grantId } : null
}

// ponytail: process-local limiter; replace with shared store when deployments need cross-instance enforcement.
const attempts = new Map<string, { count: number; resetAt: number }>()
export function allowResultAccessAttempt(key: string, now = Date.now()) {
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 }); return true }
  if (current.count >= 5) return false
  current.count += 1
  return true
}
export function resetResultAccessAttemptsForTest() { attempts.clear() }
