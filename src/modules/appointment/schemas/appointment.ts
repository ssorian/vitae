import { z } from 'zod'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const uuid = z.uuid()
export const resourceInputSchema = z.object({ clinicId: uuid, type: z.enum(['dentist', 'equipment', 'room', 'chair', 'other']), memberId: z.string().min(1).optional().nullable(), name: z.string().trim().min(1).max(120), status: z.enum(['active', 'inactive']).default('active'), isPublicBookingDefault: z.boolean().default(false) })
export const resourceAvailabilityInputSchema = z.object({ resourceId: uuid, dayOfWeek: z.number().int().min(0).max(6), startTime: time, endTime: time }).refine((v) => v.startTime < v.endTime, 'El horario final debe ser posterior')
export const resourceBlockInputSchema = z.object({ resourceId: uuid, startsAt: z.coerce.date(), endsAt: z.coerce.date(), reason: z.string().trim().max(500).optional() }).refine((v) => v.startsAt < v.endsAt, 'El bloque debe tener duración positiva')
export const availabilityInputSchema = z.object({ clinicId: uuid, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), durationMinutes: z.number().int().positive(), requiredResourceIds: z.array(uuid).min(1) })
export const appointmentInputSchema = z.object({ clinicId: uuid, patientId: uuid, startsAt: z.coerce.date(), endsAt: z.coerce.date(), resourceIds: z.array(uuid).min(1), notes: z.string().trim().max(2000).optional(), status: z.enum(['requested', 'scheduled']).default('scheduled') }).refine((v) => v.startsAt < v.endsAt, 'La cita debe tener duración positiva')
export const rescheduleInputSchema = appointmentInputSchema.extend({ id: uuid })
export const appointmentStatusInputSchema = z.object({ id: uuid, status: z.enum(['requested', 'scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'rejected', 'no_show']) })
export const scheduleOrderInputSchema = z.object({ orderId: uuid, startsAt: z.coerce.date(), endsAt: z.coerce.date(), resourceIds: z.array(uuid).min(1) }).refine((v) => v.startsAt < v.endsAt, 'La cita debe tener duración positiva')

const publicText = z.string().trim().min(1).max(120)
export const publicAvailabilityInputSchema = z.object({ clinicPublicSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
export const publicBookingInputSchema = z.object({ clinicPublicSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160), startsAt: z.coerce.date(), firstName: publicText, paternalLastName: z.string().trim().max(120).optional(), maternalLastName: z.string().trim().max(120).optional(), phone: z.string().trim().max(40).optional(), email: z.string().trim().email().max(254).optional() }).superRefine((value, context) => { if (!value.phone?.replace(/[^0-9]/g, '') && !value.email) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Se requiere teléfono o correo.' }) })
