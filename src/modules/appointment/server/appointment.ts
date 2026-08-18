'use server'

import { revalidatePath } from 'next/cache'
import { requireOrganization } from '#/infrastructure/auth/requireOrganization'
import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { appointmentInputSchema, appointmentStatusInputSchema, availabilityInputSchema, rescheduleInputSchema, scheduleOrderInputSchema } from '../schemas/appointment'
import { appointmentAccess, createClinicalAppointment, getAppointmentClinicId, getAvailableSlots, getOrderClinicId, listAgenda, listPatients, rescheduleAppointment, scheduleOrderAppointment, transitionAppointment } from '../services/appointment'

async function manager(clinicId?: string) {
  const context = await requireOrganization()
  const access = await appointmentAccess(context.organizationId, context.user.id)
  if (!access.active || !['owner', 'assistant'].includes(access.role)) throw new Error('FORBIDDEN')
  if (clinicId) await requireClinicAccess(clinicId)
  else if (access.role === 'assistant') throw new Error('FORBIDDEN')
  return { ...context, access }
}

function revalidateClinic(clinicId: string) { revalidatePath(`/clinics/${clinicId}`) }

export async function listPatientsAction(clinicId?: string) { const { organizationId } = await manager(clinicId); return listPatients(organizationId) }
export async function getAvailableSlotsAction(input: unknown) { const data = availabilityInputSchema.parse(input); const { organizationId } = await manager(data.clinicId); return getAvailableSlots(data, organizationId) }
export async function createAppointmentAction(input: unknown) { const data = appointmentInputSchema.parse(input); const { organizationId, user } = await manager(data.clinicId); const result = await createClinicalAppointment(organizationId, user.id, data); revalidateClinic(data.clinicId); return result }
export async function rescheduleAppointmentAction(input: unknown) { const data = rescheduleInputSchema.parse(input); const currentClinicId = await getAppointmentClinicId(data.id); await manager(currentClinicId); const { organizationId, user } = await manager(data.clinicId); const { id, ...slot } = data; const result = await rescheduleAppointment(organizationId, user.id, id, slot); revalidateClinic(data.clinicId); return result }
export async function transitionAppointmentAction(input: unknown) { const data = appointmentStatusInputSchema.parse(input); const clinicId = await getAppointmentClinicId(data.id); const context = await manager(clinicId); const result = await transitionAppointment(context.organizationId, context.user.id, context.access.role, data.id, data.status); revalidateClinic(clinicId); return result }
export async function listAgendaAction(clinicId?: string, date?: string) { const context = await manager(clinicId); return listAgenda(context.organizationId, clinicId, date) }
export async function scheduleOrderAppointmentAction(input: unknown) { const data = scheduleOrderInputSchema.parse(input); const clinicId = await getOrderClinicId(data.orderId); const { organizationId, user } = await manager(clinicId); const result = await scheduleOrderAppointment(organizationId, user.id, data); revalidateClinic(clinicId); return result }
