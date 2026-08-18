import assert from 'node:assert/strict'
import test from 'node:test'

import {
  hashPatientPortalInvitationToken,
  isPatientPortalInvitationUsable,
  isPatientPortalOwnershipEligible,
  patientPortalActivationInputSchema,
  patientPortalInvitationExpiresAt,
  patientPortalUserEmail,
  shouldReplacePatientPortalInvitation,
} from './portal'

test('patient portal invitation hashes tokens and expires after 72 hours', () => {
  const now = new Date('2026-08-11T10:00:00.000Z')

  assert.equal(
    hashPatientPortalInvitationToken('token'),
    '3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0',
  )
  assert.equal(patientPortalInvitationExpiresAt(now).toISOString(), '2026-08-14T10:00:00.000Z')
})

test('patient portal invitations are one-time and revocable', () => {
  const now = new Date('2026-08-11T10:00:00.000Z')
  const invitation = { expiresAt: new Date('2026-08-11T10:01:00.000Z'), usedAt: null, revokedAt: null }

  assert.equal(isPatientPortalInvitationUsable(invitation, now), true)
  assert.equal(isPatientPortalInvitationUsable({ ...invitation, usedAt: now }, now), false)
  assert.equal(isPatientPortalInvitationUsable({ ...invitation, revokedAt: now }, now), false)
  assert.equal(isPatientPortalInvitationUsable({ ...invitation, expiresAt: now }, now), false)
})

test('issuing an invitation replaces only prior unused, active invitations', () => {
  const now = new Date('2026-08-11T10:00:00.000Z')

  assert.equal(shouldReplacePatientPortalInvitation({ usedAt: null, revokedAt: null }), true)
  assert.equal(shouldReplacePatientPortalInvitation({ usedAt: now, revokedAt: null }), false)
  assert.equal(shouldReplacePatientPortalInvitation({ usedAt: null, revokedAt: now }), false)
})

test('patient activation accepts Better Auth username credentials and uses a safe account email', () => {
  assert.deepEqual(
    patientPortalActivationInputSchema.safeParse({ token: 'token', username: 'Patient_01', password: 'password1' }).success,
    true,
  )
  assert.equal(patientPortalActivationInputSchema.safeParse({ token: '', username: 'no spaces', password: 'short' }).success, false)
  assert.equal(patientPortalUserEmail('patient-id', ' Patient@example.com '), 'patient@example.com')
  assert.equal(patientPortalUserEmail('patient-id', null), 'patient-patient-id@patient.invalid')
  assert.equal(patientPortalUserEmail('patient-id', 'not-an-email'), 'patient-patient-id@patient.invalid')
})

test('patient ownership requires a verified, non-revoked account', () => {
  const verifiedAt = new Date('2026-08-11T10:00:00.000Z')

  assert.equal(isPatientPortalOwnershipEligible({ verifiedAt, revokedAt: null }), true)
  assert.equal(isPatientPortalOwnershipEligible({ verifiedAt: null, revokedAt: null }), false)
  assert.equal(isPatientPortalOwnershipEligible({ verifiedAt, revokedAt: verifiedAt }), false)
})
