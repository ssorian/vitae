'use server'

import { and, eq, isNotNull, isNull } from 'drizzle-orm'

import { auth } from '#/infrastructure/auth/auth'
import { patientAccount } from '#/infrastructure/auth/db/schema'
import { db } from '#/infrastructure/database'
import { patient } from '#/modules/patient/db/schema'

import { publicAvailabilityInputSchema, publicBookingInputSchema, publicExistingBookingInputSchema, publicExistingStudyBookingInputSchema, publicStudyBookingInputSchema } from '../schemas/appointment'
import { createPublicAppointment, createPublicStudyOrder, getPublicAvailableSlots, listPublicClinics } from '../services/appointment'

export async function listPublicBookingClinicsAction() { return listPublicClinics() }

export async function getPublicAvailabilityAction(input: unknown) {
  const parsed = publicAvailabilityInputSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  try { return { success: true as const, slots: await getPublicAvailableSlots(parsed.data) } } catch { return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const } }
}

export async function createPublicAppointmentAction(input: unknown) {
  const parsed = publicBookingInputSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  return createPublicAppointment(parsed.data)
}

export async function createPublicStudyOrderAction(input: unknown) {
  const parsed = publicStudyBookingInputSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  return createPublicStudyOrder(parsed.data)
}

export async function createExistingPublicAppointmentAction(input: unknown) {
  const parsed = publicExistingBookingInputSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  return createExistingPublicAppointment(parsed.data)
}

export async function createExistingPublicStudyOrderAction(input: unknown) {
  const parsed = publicExistingStudyBookingInputSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  return createExistingPublicStudyOrder(parsed.data)
}

type AuthenticatedPatientBookingIdentity = { patientId: string; firstName: string; paternalLastName: string | null; maternalLastName: string | null; phone: string | null; email: string | null }

async function currentPatientBookingIdentity(): Promise<AuthenticatedPatientBookingIdentity | null> {
  const { headers } = await import('next/headers')
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const [identity] = await db.select({ patientId: patientAccount.patientId, firstName: patient.firstName, paternalLastName: patient.paternalLastName, maternalLastName: patient.maternalLastName, phone: patient.phone, email: patient.email }).from(patientAccount).innerJoin(patient, eq(patientAccount.patientId, patient.id)).where(and(eq(patientAccount.userId, session.user.id), isNotNull(patientAccount.verifiedAt), isNull(patientAccount.revokedAt)))
  return identity ?? null
}

export async function getAuthenticatedPatientBookingAction() { return currentPatientBookingIdentity() }

export async function createAuthenticatedPublicAppointmentAction(input: unknown) {
  const identity = await currentPatientBookingIdentity()
  const parsed = publicBookingInputSchema.safeParse({ ...(typeof input === 'object' && input ? input : {}), ...identity })
  if (!identity || !parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  return createPublicAppointment(parsed.data, identity.patientId)
}

export async function createAuthenticatedPublicStudyOrderAction(input: unknown) {
  const identity = await currentPatientBookingIdentity()
  const parsed = publicStudyBookingInputSchema.safeParse({ ...(typeof input === 'object' && input ? input : {}), ...identity })
  if (!identity || !parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  return createPublicStudyOrder(parsed.data, identity.patientId)
}

async function createExistingPublicAppointment(input: { clinicPublicSlug: string; startsAt: Date; phone?: string; email?: string }) {
  // This branch never creates a profile; both a match and a miss return the same public result shape.
  return createPublicAppointment({ ...input, firstName: 'Paciente' }, undefined, true)
}

async function createExistingPublicStudyOrder(input: { clinicPublicSlug: string; startsAt: Date; phone?: string; email?: string; type: 'radiography' | 'cbct'; details: Record<string, unknown>; doctor?: { firstName: string; paternalLastName: string; maternalLastName?: string; professionalLicense?: string; specialty?: string; clinicName?: string; phone?: string; email: string } }) {
  return createPublicStudyOrder({ ...input, firstName: 'Paciente' }, undefined, true)
}
