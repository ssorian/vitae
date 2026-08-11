'use server'

import { revalidatePath } from 'next/cache'

import { requireOrganization } from '#/infrastructure/auth/requireOrganization'

import {
  archiveClinic,
  createClinic,
  listClinics,
  updateClinic,
} from '../services/clinic'

import {
  clinicIdSchema,
  clinicInputSchema,
  updateClinicSchema,
} from '../schemas/clinic'

export async function listClinicsAction() {
  const { organizationId } = await requireOrganization()

  return listClinics(organizationId)
}

export async function createClinicAction(input: unknown) {
  const data = clinicInputSchema.parse(input)

  const { organizationId } = await requireOrganization()

  const clinic = await createClinic(
    organizationId,
    data,
  )

  revalidatePath('/org/clinics')

  return clinic
}

export async function updateClinicAction(input: unknown) {
  const data = updateClinicSchema.parse(input)

  const { organizationId } = await requireOrganization()

  const { id, ...clinicInput } = data

  const clinic = await updateClinic(
    organizationId,
    id,
    clinicInput,
  )

  revalidatePath('/org/clinics')

  return clinic
}

export async function archiveClinicAction(input: unknown) {
  const data = clinicIdSchema.parse(input)

  const { organizationId } = await requireOrganization()

  const clinic = await archiveClinic(
    organizationId,
    data.id,
  )

  revalidatePath('/org/clinics')

  return clinic
}
