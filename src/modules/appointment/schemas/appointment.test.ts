import assert from 'node:assert/strict'
import test from 'node:test'

import { appointmentInputSchema, normalizePatientContact } from './appointment'

const slot = { clinicId: '00000000-0000-4000-8000-000000000001', startsAt: '2026-01-01T10:00:00.000Z', endsAt: '2026-01-01T10:30:00.000Z' }

test('internal new-patient appointments require identity and contact details', () => {
  assert.equal(appointmentInputSchema.safeParse({ ...slot, patient: { firstName: 'Ana', paternalLastName: 'López' } }).success, false)
  assert.equal(appointmentInputSchema.safeParse({ ...slot, patient: { firstName: 'Ana', paternalLastName: 'López', phone: '+52 55 1234 5678' } }).success, true)
})

test('internal duplicate matching normalizes contacts', () => {
  assert.deepEqual(normalizePatientContact({ email: ' ANA@EXAMPLE.COM ', phone: '+52 (55) 1234-5678' }), { email: 'ana@example.com', phone: '525512345678' })
})
