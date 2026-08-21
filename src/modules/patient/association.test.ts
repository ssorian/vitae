import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizePatientEmail, normalizePatientPhone, patientFieldsFromAccountName, patientMatchesAccount } from './association'

test('patient association matches an unambiguous normalized name and email', () => {
  assert.equal(patientMatchesAccount({ firstName: 'María', paternalLastName: 'López', maternalLastName: null, email: ' MARIA@EXAMPLE.COM ', phone: '55 1234 5678' }, { name: 'Maria Lopez', email: 'maria@example.com' }), true)
  assert.equal(patientMatchesAccount({ firstName: 'María', paternalLastName: 'López', maternalLastName: null, email: 'maria@example.com', phone: '55 1234 5678' }, { name: 'Otra Persona', email: 'maria@example.com' }), false)
})

test('patient association only compares a phone when an authenticated account safely supplies one', () => {
  const patient = { firstName: 'Ana', paternalLastName: null, maternalLastName: null, email: 'ana@example.com', phone: '55 1234 5678' }
  assert.equal(patientMatchesAccount(patient, { name: 'Ana', email: 'ana@example.com' }), true)
  assert.equal(patientMatchesAccount(patient, { name: 'Ana', email: 'ana@example.com', phone: '5512340000' }), false)
  assert.equal(normalizePatientEmail(' ANA@EXAMPLE.COM '), 'ana@example.com')
  assert.equal(normalizePatientPhone('+52 (55) 1234-5678'), '525512345678')
})

test('new patient fields are derived server-side from the account name', () => {
  assert.deepEqual(patientFieldsFromAccountName('  Ana María López  '), { firstName: 'Ana', paternalLastName: 'María López' })
  assert.deepEqual(patientFieldsFromAccountName(''), { firstName: 'Paciente', paternalLastName: null })
})
