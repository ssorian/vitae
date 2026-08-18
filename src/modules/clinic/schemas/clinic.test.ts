import assert from 'node:assert/strict'
import test from 'node:test'

import { clinicInputSchema } from './clinic'

const input = {
  name: 'Clínica Centro',
  timezone: 'America/Mexico_City',
  slotIntervalMinutes: 15,
  publicHours: [],
  laboratoryEnabled: false,
  status: 'active' as const,
}

test('clinic public hours accept valid weekday entries and an empty schedule', () => {
  assert.equal(clinicInputSchema.safeParse({ ...input, publicHours: [] }).success, true)
  assert.equal(clinicInputSchema.safeParse({ ...input, publicHours: [{ dayOfWeek: 0, startTime: '09:00', endTime: '17:00' }, { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' }] }).success, true)
})

test('clinic public hours reject invalid ranges and duplicate days', () => {
  assert.equal(clinicInputSchema.safeParse({ ...input, publicHours: [{ dayOfWeek: 1, startTime: '17:00', endTime: '09:00' }] }).success, false)
  assert.equal(clinicInputSchema.safeParse({ ...input, publicHours: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, { dayOfWeek: 1, startTime: '10:00', endTime: '14:00' }] }).success, false)
})

test('clinic public hours reject intervals incompatible with public 30-minute appointments', () => {
  assert.equal(clinicInputSchema.safeParse({ ...input, slotIntervalMinutes: 20 }).success, false)
})
