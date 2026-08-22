import assert from 'node:assert/strict'
import test from 'node:test'

import { appointmentConfirmationEmail } from './appointmentConfirmation'

test('builds a patient-only clinical appointment confirmation in the clinic timezone', () => {
  assert.deepEqual(appointmentConfirmationEmail({
    patientEmail: 'patient@example.com',
    patientName: 'Ana Pérez',
    startsAt: new Date('2026-05-01T16:30:00.000Z'),
    kind: 'clinical',
    clinic: { name: 'Clínica Norte', timezone: 'America/Mexico_City', address: 'Av. Siempre Viva 123', phone: '5551234567' },
  }), {
    to: 'patient@example.com',
    subject: 'Cita clínica confirmada - Clínica Norte',
    props: { patientName: 'Ana Pérez', kindLabel: 'Cita clínica', date: 'viernes, 1 de mayo de 2026', time: '10:30', clinicName: 'Clínica Norte', logoUrl: 'http://localhost:3000/image.svg', address: 'Av. Siempre Viva 123', phone: '5551234567' },
  })
})

test('skips patients without email and includes the order folio for studies', () => {
  assert.equal(appointmentConfirmationEmail({ patientEmail: null, patientName: 'Ana Pérez', startsAt: new Date(), kind: 'clinical', clinic: { name: 'Clínica Norte', timezone: 'America/Mexico_City' } }), null)
  const email = appointmentConfirmationEmail({ patientEmail: 'patient@example.com', patientName: 'Ana Pérez', startsAt: new Date('2026-05-01T16:30:00.000Z'), kind: 'study', folio: 'ORD-123', clinic: { name: 'Clínica Norte', timezone: 'America/Mexico_City' } })
  assert.equal(email?.props.kindLabel, 'Estudio')
  assert.equal(email?.props.logoUrl, 'http://localhost:3000/image.svg')
  assert.equal(email?.props.folio, 'ORD-123')
})
