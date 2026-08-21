import assert from 'node:assert/strict'
import test from 'node:test'

import { doctorAssociationEligibility, doctorFieldsFromProviderName } from './association'
import { toDoctorClientListItem } from './dto'
import { doctorClientResolutionState } from './resolution'
import { resolveDoctorClient } from './services/client'
import { doctorClientSchema } from './schemas/client'

test('doctor client input normalizes identity without changing license identifiers', () => {
  const parsed = doctorClientSchema.parse({
    firstName: ' Ana ',
    paternalLastName: ' López ',
    maternalLastName: ' ',
    professionalLicense: ' CED-123/A ',
    specialty: ' ',
    clinicName: ' Clínica Norte ',
    phone: '+52 (55) 1234-5678',
    email: ' ANA@EXAMPLE.COM ',
  })

  assert.deepEqual(parsed, {
    firstName: 'Ana',
    paternalLastName: 'López',
    maternalLastName: null,
    professionalLicense: 'CED-123/A',
    specialty: null,
    clinicName: 'Clínica Norte',
    phone: '525512345678',
    email: 'ana@example.com',
  })
})

test('doctor list DTO exposes only customer access state', () => {
  assert.deepEqual(toDoctorClientListItem({
    id: 'doctor-id', firstName: 'Ana', paternalLastName: 'López', maternalLastName: null,
    email: 'ana@example.com', phone: null, professionalLicense: 'CED-123', specialty: 'Cardiología',
    status: 'active', userId: null,
  }), {
    id: 'doctor-id', name: 'Ana López', email: 'ana@example.com', phone: null,
    professionalLicense: 'CED-123', specialty: 'Cardiología', status: 'active', accessState: 'unlinked',
  })
})

test('doctor resolution keeps an existing email record instead of replacing it', () => {
  assert.equal(doctorClientResolutionState({ id: 'existing' }), 'existing')
  assert.equal(doctorClientResolutionState(null), 'create')
})

test('shared resolution reuses an existing referrer without changing its master profile', async () => {
  const existing = { id: 'existing-referrer', firstName: 'Preserved', email: 'doctor@example.com' }
  const tx = {
    query: { doctorClient: { findFirst: async () => existing } },
    insert: () => { throw new Error('existing doctor must not be inserted') },
  }

  const resolved = await resolveDoctorClient(tx, 'organization-id', doctorClientSchema.parse({
    firstName: 'Attempted overwrite',
    paternalLastName: 'Name',
    email: 'doctor@example.com',
  }))

  assert.equal(resolved.state, 'existing')
  assert.equal(resolved.doctorClient, existing)
})

test('only verified Google identities in a bound Google completion flow can associate', () => {
  assert.deepEqual(doctorAssociationEligibility({ email: 'doctor@example.com', emailVerified: true, hasGoogleAccount: true, hasGoogleFlowEvidence: false, name: 'Ana López' }), { eligible: false, error: 'GOOGLE_FLOW_REQUIRED' })
  assert.deepEqual(doctorAssociationEligibility({ email: ' DOCTOR@EXAMPLE.COM ', emailVerified: true, hasGoogleAccount: true, hasGoogleFlowEvidence: true, name: 'Ana López' }), {
    eligible: true,
    email: 'doctor@example.com',
    fields: { firstName: 'Ana', paternalLastName: 'López' },
  })
  assert.deepEqual(doctorAssociationEligibility({ email: 'doctor@example.com', emailVerified: false, hasGoogleAccount: true, hasGoogleFlowEvidence: true, name: 'Ana López' }), { eligible: false, error: 'EMAIL_NOT_VERIFIED' })
  assert.deepEqual(doctorAssociationEligibility({ email: 'doctor@example.com', emailVerified: true, hasGoogleAccount: true, hasGoogleFlowEvidence: true, name: 'Ana' }), { eligible: false, error: 'PROFILE_REQUIRED' })
  assert.equal(doctorFieldsFromProviderName(''), null)
})
