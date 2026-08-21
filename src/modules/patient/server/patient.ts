'use server'

import { revalidatePath } from 'next/cache'

import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { db } from '#/infrastructure/database'
import { createPatientInputSchema } from '../schemas/patient'
import { resolvePatientCreation } from '../services/patient'

// This action is a public endpoint; validate and authorize every input.
export async function createPatientAction(input: unknown) {
  const data = createPatientInputSchema.parse(input)
  const context = await requireClinicAccess(data.clinicId)
  const result = await db.transaction((tx) => resolvePatientCreation(tx, context.organizationId, data.patient, data.createNewAnyway))
  if ('patient' in result) revalidatePath(`/clinics/${data.clinicId}`)
  return result
}
