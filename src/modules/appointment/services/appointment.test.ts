import assert from 'node:assert/strict'
import test from 'node:test'

import { slotsWithoutConflicts } from './appointment'

const slot = (start: string, end: string) => ({ clinicId: 'clinic', startsAt: new Date(start), endsAt: new Date(end) })

test('slotsWithoutConflicts excludes overlaps but keeps touching boundaries', () => {
  const candidates = [slot('2026-01-01T10:00:00Z', '2026-01-01T10:30:00Z'), slot('2026-01-01T10:30:00Z', '2026-01-01T11:00:00Z')]

  assert.deepEqual(slotsWithoutConflicts(candidates, [slot('2026-01-01T09:30:00Z', '2026-01-01T10:00:00Z'), slot('2026-01-01T11:00:00Z', '2026-01-01T11:30:00Z')]), candidates)
  assert.deepEqual(slotsWithoutConflicts(candidates, [slot('2026-01-01T10:15:00Z', '2026-01-01T10:45:00Z')]), [])
})
