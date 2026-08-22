import { and, eq } from 'drizzle-orm'
import { Resend } from 'resend'

import { env } from '#/config/env'
import { db } from '#/infrastructure/database'
import { clinic } from '#/modules/clinic/db/schema'
import { order } from '#/modules/order/db/schema'
import { patient } from '#/modules/patient/db/schema'
import { AppointmentScheduledEmail } from '#/modules/appointment/emails/AppointmentScheduledEmail'
import { appointment } from '../db/schema'

type ConfirmationInput = {
  patientEmail: string | null
  patientName: string
  startsAt: Date
  kind: 'clinical' | 'study'
  folio?: string | null
  clinic: { name: string; timezone: string; address?: string | null; phone?: string | null }
}

export function appointmentConfirmationEmail(input: ConfirmationInput) {
  const to = input.patientEmail?.trim()
  if (!to) return null
  const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeZone: input.clinic.timezone }).format(input.startsAt)
  const time = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: input.clinic.timezone }).format(input.startsAt)
  const kindLabel = input.kind === 'clinical' ? 'Cita clínica' : 'Estudio'
  const logoUrl = new URL('/image.svg', env.BETTER_AUTH_URL).toString()
  const props = { patientName: input.patientName, kindLabel, date, time, clinicName: input.clinic.name, logoUrl, address: input.clinic.address, phone: input.clinic.phone, ...(input.folio ? { folio: input.folio } : {}) }
  return { to, subject: `${kindLabel} confirmada - ${input.clinic.name}`, props }
}

export async function sendAppointmentConfirmation(appointmentId: string) {
  try {
    const [record] = await db.select({ patientEmail: patient.email, firstName: patient.firstName, paternalLastName: patient.paternalLastName, maternalLastName: patient.maternalLastName, startsAt: appointment.startsAt, kind: appointment.kind, folio: order.folio, clinicName: clinic.name, timezone: clinic.timezone, address: clinic.addressLine, phone: clinic.phone }).from(appointment).innerJoin(patient, eq(appointment.patientId, patient.id)).innerJoin(clinic, eq(appointment.clinicId, clinic.id)).leftJoin(order, eq(appointment.orderId, order.id)).where(and(eq(appointment.id, appointmentId), eq(appointment.status, 'scheduled')))
    if (!record) return
    const email = appointmentConfirmationEmail({ patientEmail: record.patientEmail, patientName: [record.firstName, record.paternalLastName, record.maternalLastName].filter(Boolean).join(' '), startsAt: record.startsAt, kind: record.kind, folio: record.folio, clinic: { name: record.clinicName, timezone: record.timezone, address: record.address, phone: record.phone } })
    if (!email) return
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL
    if (!apiKey || !from) throw new Error('APPOINTMENT_CONFIRMATION_CONFIG_MISSING')
    const { error } = await new Resend(apiKey).emails.send({ from, to: email.to, subject: email.subject, react: AppointmentScheduledEmail(email.props) })
    if (error) throw new Error(`APPOINTMENT_CONFIRMATION_FAILED:${error.message}`)
  } catch (error) {
    console.error('APPOINTMENT_CONFIRMATION_FAILED', error)
  }
}
