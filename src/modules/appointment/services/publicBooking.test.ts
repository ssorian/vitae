import assert from 'node:assert/strict'
import test from 'node:test'

import { publicExistingBookingInputSchema } from '../schemas/appointment'
import { publicBookingFailure, publicBookingPatientId } from './appointment'

test('authenticated public booking selects the server-resolved patient id over a contact match', () => {
  assert.equal(publicBookingPatientId('owned-patient-id', 'contact-matched-patient-id'), 'owned-patient-id')
})

test('existing-contact booking accepts contact without profile fields and has no patient id input', () => {
  const parsed = publicExistingBookingInputSchema.safeParse({ clinicPublicSlug: 'centro-vitae', startsAt: '2026-05-01T10:00:00.000Z', email: 'patient@example.com' })
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal('patientId' in parsed.data, false)
    assert.equal('firstName' in parsed.data, false)
  }
  assert.equal(publicExistingBookingInputSchema.safeParse({ clinicPublicSlug: 'centro-vitae', startsAt: '2026-05-01T10:00:00.000Z' }).success, false)
  assert.deepEqual(publicBookingFailure(new Error('BOOKING_UNAVAILABLE')), { success: false, error: 'BOOKING_UNAVAILABLE' })
})
