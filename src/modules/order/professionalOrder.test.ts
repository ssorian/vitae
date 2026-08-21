import assert from 'node:assert/strict'
import test from 'node:test'

import { authenticatedProfessionalOrderSchema } from './schemas/generalOrder'

test('authenticated professional order input has no doctor fields', () => {
  const input = {
    type: 'radiography',
    clinicId: '123e4567-e89b-12d3-a456-426614174000',
    patient: { firstName: 'Paciente' },
    details: { radiographyType: 'Panorámica', region: 'Mandíbula', clinicalIndication: 'Control' },
  }

  const parsed = authenticatedProfessionalOrderSchema.safeParse(input)
  assert.equal(parsed.success, true)
  if (parsed.success) assert.equal('doctor' in parsed.data, false)
})

test('active professional order input accepts endodontic evaluations without specialty checks', () => {
  assert.equal(authenticatedProfessionalOrderSchema.safeParse({
    type: 'endodontic_evaluation',
    clinicId: '123e4567-e89b-12d3-a456-426614174000',
    patient: { firstName: 'Paciente' },
    details: { toothNumber: '11', canals: [{ canal: 'Vestibular' }] },
  }).success, true)
})

test('client-supplied doctor data is rejected for authenticated professional orders', () => {
  const result = authenticatedProfessionalOrderSchema.safeParse({
    type: 'radiography',
    clinicId: '123e4567-e89b-12d3-a456-426614174000',
    patient: { firstName: 'Paciente' },
    details: { radiographyType: 'Panorámica', region: 'Mandíbula', clinicalIndication: 'Control' },
    doctor: { id: 'attacker-controlled-doctor-id' },
  })

  assert.equal(result.success, false)
})
