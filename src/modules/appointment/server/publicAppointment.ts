'use server'

import { publicAvailabilityInputSchema, publicBookingInputSchema } from '../schemas/appointment'
import { createPublicAppointment, getPublicAvailableSlots, listPublicClinics } from '../services/appointment'

export async function listPublicBookingClinicsAction() {
  return listPublicClinics()
}

export async function getPublicAvailabilityAction(input: unknown) {
  const parsed = publicAvailabilityInputSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  try {
    return { success: true as const, slots: await getPublicAvailableSlots(parsed.data) }
  } catch {
    return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  }
}

export async function createPublicAppointmentAction(input: unknown) {
  const parsed = publicBookingInputSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'BOOKING_UNAVAILABLE' as const }
  return createPublicAppointment(parsed.data)
}
