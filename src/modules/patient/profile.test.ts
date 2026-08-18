import assert from 'node:assert/strict'
import test from 'node:test'

import { bucketPatientAppointments, hasValidPatientResultAssetParams, isPatientResultAssetEligible, isRequestedPatientOwned, resultStatusLabel } from './profile'

test('patient route only accepts the patient account owner', () => {
  assert.equal(isRequestedPatientOwned('patient-1', 'patient-1'), true)
  assert.equal(isRequestedPatientOwned('patient-1', 'patient-2'), false)
})

test('patient appointments separate active future appointments from history', () => {
  const now = new Date('2026-08-11T10:00:00.000Z')
  const appointments = [
    { id: 'scheduled', startsAt: new Date('2026-08-12T10:00:00.000Z'), status: 'scheduled' },
    { id: 'cancelled', startsAt: new Date('2026-08-12T10:00:00.000Z'), status: 'cancelled' },
    { id: 'past', startsAt: new Date('2026-08-10T10:00:00.000Z'), status: 'completed' },
  ]

  assert.deepEqual(bucketPatientAppointments(appointments, now).upcoming.map(({ id }) => id), ['scheduled'])
  assert.deepEqual(bucketPatientAppointments(appointments, now).history.map(({ id }) => id), ['cancelled', 'past'])
})

test('patient result status only advertises finalized available results', () => {
  assert.equal(resultStatusLabel('ready', true), 'Resultado disponible')
  assert.equal(resultStatusLabel('ready', false), 'Lista')
  assert.equal(resultStatusLabel('delivered', false), 'Resultado entregado')
})

test('patient assets require a finalized available result', () => {
  const finalizedAt = new Date('2026-08-11T10:00:00.000Z')
  assert.equal(isPatientResultAssetEligible('ready', finalizedAt), true)
  assert.equal(isPatientResultAssetEligible('delivered', finalizedAt), true)
  assert.equal(isPatientResultAssetEligible('in_progress', finalizedAt), false)
  assert.equal(isPatientResultAssetEligible('ready', null), false)
})

test('patient asset routes reject malformed identifiers', () => {
  const valid = '123e4567-e89b-42d3-a456-426614174000'
  assert.equal(hasValidPatientResultAssetParams({ patientId: valid, orderId: valid, assetId: valid }), true)
  assert.equal(hasValidPatientResultAssetParams({ patientId: valid, orderId: 'not-an-id', assetId: valid }), false)
})
