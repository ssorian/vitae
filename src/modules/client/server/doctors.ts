'use server'

import { asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { db } from '#/infrastructure/database'

import { toDoctorClientListItem } from '../dto'
import { doctorClient } from '../db/schema'
import { doctorClientSchema } from '../schemas/client'
import { resolveDoctorClient } from '../services/client'

const clinicIdSchema = z.string().uuid()
const createDoctorClientInputSchema = z.object({ clinicId: clinicIdSchema, doctor: doctorClientSchema })

export async function listDoctorClientsAction(clinicId: unknown) {
  const id = clinicIdSchema.parse(clinicId)
  const { organizationId } = await requireClinicAccess(id)
  const doctors = await db.select({
    id: doctorClient.id,
    firstName: doctorClient.firstName,
    paternalLastName: doctorClient.paternalLastName,
    maternalLastName: doctorClient.maternalLastName,
    email: doctorClient.email,
    phone: doctorClient.phone,
    professionalLicense: doctorClient.professionalLicense,
    specialty: doctorClient.specialty,
    status: doctorClient.status,
    userId: doctorClient.userId,
  }).from(doctorClient).where(eq(doctorClient.organizationId, organizationId)).orderBy(asc(doctorClient.firstName), asc(doctorClient.paternalLastName))

  return doctors.map(toDoctorClientListItem)
}

export async function createDoctorClientAction(input: unknown) {
  const data = createDoctorClientInputSchema.parse(input)
  const { organizationId } = await requireClinicAccess(data.clinicId)
  const result = await db.transaction((tx) => resolveDoctorClient(tx, organizationId, data.doctor))
  revalidatePath(`/clinics/${data.clinicId}/doctors`)
  if (result.state === 'created') return { state: 'created' as const }
  const { id, name, email } = toDoctorClientListItem(result.doctorClient)
  return { state: 'existing' as const, match: { id, name, email } }
}
