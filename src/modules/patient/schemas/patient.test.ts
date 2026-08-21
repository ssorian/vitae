import assert from 'node:assert/strict'
import test from 'node:test'

import { createPatientInputSchema, newPatientInputSchema, normalizePatientContact } from './patient'

const clinicId = '00000000-0000-4000-8000-000000000001'

test('new patient input requires identity and at least one contact', () => {
  assert.equal(newPatientInputSchema.safeParse({ firstName: 'Ana', paternalLastName: 'López' }).success, false)
  assert.equal(newPatientInputSchema.safeParse({ firstName: 'Ana', paternalLastName: 'López', phone: '+52 55 1234 5678' }).success, true)
  assert.equal(createPatientInputSchema.safeParse({ clinicId, patient: { firstName: 'Ana', paternalLastName: 'López', email: 'ana@example.com' } }).success, true)
})

test('patient contacts are normalized before organization-scoped matching', () => {
  assert.deepEqual(normalizePatientContact({ email: ' ANA@EXAMPLE.COM ', phone: '+52 (55) 1234-5678' }), { email: 'ana@example.com', phone: '525512345678' })
})
