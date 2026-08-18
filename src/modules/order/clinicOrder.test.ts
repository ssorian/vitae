import assert from 'node:assert/strict'
import test from 'node:test'

import { matchesClinicOrder } from './clinicOrder'

test('clinic order routes only match orders from their clinic', () => {
  assert.equal(matchesClinicOrder('clinic-a', { clinicId: 'clinic-a' }), true)
  assert.equal(matchesClinicOrder('clinic-a', { clinicId: 'clinic-b' }), false)
  assert.equal(matchesClinicOrder('clinic-a', null), false)
})
