import assert from 'node:assert/strict'
import test from 'node:test'

import { appointmentInputSchema, normalizePatientContact, publicNewBookingInputSchema, publicStudyBookingInputSchema } from './appointment'

const slot = { clinicId: '00000000-0000-4000-8000-000000000001', startsAt: '2026-01-01T10:00:00.000Z', endsAt: '2026-01-01T10:30:00.000Z' }

test('internal new-patient appointments require identity and contact details', () => {
  assert.equal(appointmentInputSchema.safeParse({ ...slot, patient: { firstName: 'Ana', paternalLastName: 'López' } }).success, false)
  assert.equal(appointmentInputSchema.safeParse({ ...slot, patient: { firstName: 'Ana', paternalLastName: 'López', phone: '+52 55 1234 5678' } }).success, true)
})

test('internal duplicate matching normalizes contacts', () => {
  assert.deepEqual(normalizePatientContact({ email: ' ANA@EXAMPLE.COM ', phone: '+52 (55) 1234-5678' }), { email: 'ana@example.com', phone: '525512345678' })
})

test('new public bookings require both surnames and retain the maternal surname', () => {
  const request = { clinicPublicSlug: 'clinica', startsAt: '2026-01-01T10:00:00.000Z', firstName: 'Ana', paternalLastName: 'López', maternalLastName: 'García', phone: '5512345678' }
  const parsed = publicNewBookingInputSchema.safeParse(request)
  assert.equal(parsed.success, true)
  if (parsed.success) assert.equal(parsed.data.maternalLastName, 'García')
  assert.equal(publicNewBookingInputSchema.safeParse({ ...request, maternalLastName: '' }).success, false)
  assert.equal(publicNewBookingInputSchema.safeParse({ ...request, paternalLastName: undefined }).success, false)
})

test('public study requests reject endodontic evaluations', () => {
  assert.equal(publicStudyBookingInputSchema.safeParse({ clinicPublicSlug: 'clinica', startsAt: '2026-01-01T10:00:00.000Z', firstName: 'Ana', type: 'endodontic_evaluation', details: { toothNumber: '11', canals: [{ canal: 'A' }] } }).success, false)
})

test('public study requests allow self-referral and validate an optional referring professional', () => {
  const request = { clinicPublicSlug: 'clinica', startsAt: '2026-01-01T10:00:00.000Z', firstName: 'Ana', phone: '5512345678', type: 'intraoral_scan' as const, details: { outputFormat: 'STL' } }
  assert.equal(publicStudyBookingInputSchema.safeParse(request).success, true)
  assert.equal(publicStudyBookingInputSchema.safeParse({ ...request, doctor: { firstName: 'Dra.', paternalLastName: 'López', email: 'doctora@example.com' } }).success, true)
  assert.equal(publicStudyBookingInputSchema.safeParse({ ...request, doctor: { firstName: 'Dra.', paternalLastName: 'López', email: 'invalid' } }).success, false)
  assert.equal(publicStudyBookingInputSchema.safeParse({ ...request, firstName: '', email: 'invalid' }).success, false)
})
