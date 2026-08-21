import assert from 'node:assert/strict'
import test from 'node:test'

import { allowResultAccessAttempt, grantCookieValue, hasUsableResultGrant, parseGrantCookie, resetResultAccessAttemptsForTest, resultGrantExpiresAt, sanitizeDownloadFilename, secureSecretMatches, selectResultDeliveryTarget } from './resultAccess'

test('result secrets are hashed, expire, and use generic cookie grants', () => {
  const now = new Date('2026-08-11T10:00:00.000Z')
  const hash = '3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0'
  assert.equal(secureSecretMatches('token', hash), true)
  assert.equal(secureSecretMatches('wrong', hash), false)
  assert.equal(resultGrantExpiresAt(now).toISOString(), '2026-09-10T10:00:00.000Z')
  assert.equal(hasUsableResultGrant({ expiresAt: now, revokedAt: null }, now), false)
  assert.deepEqual(parseGrantCookie(grantCookieValue('order', 'grant')), { orderId: 'order', grantId: 'grant' })
  assert.equal(parseGrantCookie('bad.value.extra'), null)
})

test('download filenames are safe for response and archive headers', () => {
  assert.equal(sanitizeDownloadFilename('../study\u0000.dcm'), '.._study_.dcm')
  assert.equal(sanitizeDownloadFilename('  '), 'resultado')
  assert.equal(sanitizeDownloadFilename('result: one?.jpg'), 'result_ one_.jpg')
})

test('delivery prefers active patient accounts and otherwise uses patient email or code', () => {
  const verifiedAt = new Date()
  assert.deepEqual(selectResultDeliveryTarget({ patientId: 'patient', patientEmail: 'a@example.com', account: { verifiedAt, revokedAt: null } }), { kind: 'account', patientId: 'patient', email: 'a@example.com' })
  assert.deepEqual(selectResultDeliveryTarget({ patientId: 'patient', patientEmail: ' A@example.com ', account: null }), { kind: 'email', email: 'a@example.com' })
  assert.deepEqual(selectResultDeliveryTarget({ patientId: 'patient', patientEmail: null, account: { verifiedAt, revokedAt: null } }), { kind: 'code' })
  assert.deepEqual(selectResultDeliveryTarget({ patientId: 'patient', patientEmail: 'patient-id@patient.invalid', account: { verifiedAt, revokedAt: null } }), { kind: 'code' })
  assert.deepEqual(selectResultDeliveryTarget({ patientId: 'patient', patientEmail: 'not-an-email', account: null }), { kind: 'code' })
  assert.deepEqual(selectResultDeliveryTarget({ patientId: 'patient', patientEmail: null, account: null }), { kind: 'code' })
})

test('folio access is bounded to five attempts per fifteen minutes', () => {
  resetResultAccessAttemptsForTest()
  for (let count = 0; count < 5; count++) assert.equal(allowResultAccessAttempt('ip:folio', 0), true)
  assert.equal(allowResultAccessAttempt('ip:folio', 0), false)
  assert.equal(allowResultAccessAttempt('ip:folio', 15 * 60 * 1000), true)
})
