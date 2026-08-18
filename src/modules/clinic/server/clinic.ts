'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireOrganization } from '#/infrastructure/auth/requireOrganization'
import { requireOwner } from '#/modules/member/services/member'

import {
  archiveClinic,
  createClinic,
  listClinics,
  updateClinic,
  updateClinicSettings,
  setLaboratoryEnabled,
} from '../services/clinic'
import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'

import {
  clinicIdSchema,
  clinicInputSchema,
  publicBookingSettingsSchema,
  updateClinicSchema,
} from '../schemas/clinic'

export async function listClinicsAction() {
  const { organizationId, user } = await requireOrganization()
  await requireOwner(organizationId, user.id)
  return listClinics(organizationId)
}

export async function createClinicAction(input: unknown) {
  const data = clinicInputSchema.parse(input)

  const { organizationId, user } = await requireOrganization()
  await requireOwner(organizationId, user.id)

  const clinic = await createClinic(
    organizationId,
    data,
  )

  revalidatePath('/org/clinics')

  return clinic
}

export async function updateClinicAction(input: unknown) {
  const data = updateClinicSchema.parse(input)

  const { organizationId, user } = await requireOrganization()
  await requireOwner(organizationId, user.id)

  const { id, ...clinicInput } = data

  const clinic = await updateClinic(
    organizationId,
    id,
    clinicInput,
  )

  revalidatePath('/org/clinics')

  return clinic
}

export async function updateClinicSettingsAction(clinicId: string, input: unknown) {
  const data = publicBookingSettingsSchema.extend({ laboratoryEnabled: z.boolean() }).parse(input)
  const context = await requireClinicAccess(clinicId)
  const updated = await updateClinicSettings(context.organizationId, clinicId, data)
  revalidatePath(`/clinics/${clinicId}`)
  return updated
}

export async function setLaboratoryEnabledAction(clinicId: string, laboratoryEnabled: boolean) {
  const context = await requireClinicAccess(clinicId)
  const updated = await setLaboratoryEnabled(context.organizationId, clinicId, laboratoryEnabled)
  revalidatePath(`/clinics/${clinicId}`)
  return updated
}

export async function archiveClinicAction(input: unknown) {
  const data = clinicIdSchema.parse(input)

  const { organizationId, user } = await requireOrganization()
  await requireOwner(organizationId, user.id)

  const clinic = await archiveClinic(
    organizationId,
    data.id,
  )

  revalidatePath('/org/clinics')

  return clinic
}
