import { z } from 'zod'

import type { ClinicPublicHours } from '../db/schema'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional()

export const publicHoursSchema = z.array(z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora de apertura no es válida'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora de cierre no es válida'),
})).superRefine((hours, context) => {
  const days = new Set<number>()
  for (const [index, hour] of hours.entries()) {
    if (days.has(hour.dayOfWeek)) context.addIssue({ code: 'custom', path: [index, 'dayOfWeek'], message: 'Cada día solo puede tener un horario' })
    days.add(hour.dayOfWeek)
    if (hour.startTime >= hour.endTime) context.addIssue({ code: 'custom', path: [index, 'endTime'], message: 'La apertura debe ser antes del cierre' })
  }
})

export const publicBookingSettingsSchema = z.object({
  slotIntervalMinutes: z.number().int().refine((value) => [5, 10, 15, 30].includes(value), 'El intervalo debe ser de 5, 10, 15 o 30 minutos para citas públicas de 30 minutos'),
  publicHours: publicHoursSchema,
})

export const clinicInputSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  phone: optionalText(30),
  email: z
    .email('El correo no es válido')
    .max(255)
    .or(z.literal(''))
    .transform((value) => value || undefined)
    .optional(),
  addressLine: optionalText(255),
  neighborhood: optionalText(120),
  municipality: optionalText(120),
  state: optionalText(120),
  postalCode: optionalText(20),
  timezone: z.string().trim().min(1, 'La zona horaria es obligatoria').max(100),
  ...publicBookingSettingsSchema.shape,
  laboratoryEnabled: z.boolean(),
  status: z.enum(['active', 'inactive']),
})

export const clinicIdSchema = z.object({
  id: z.uuid(),
})

export const updateClinicSchema = clinicInputSchema.extend({
  id: z.uuid(),
})

export type ClinicInput = z.infer<typeof clinicInputSchema> & { publicHours: ClinicPublicHours }
export type PublicBookingSettings = z.infer<typeof publicBookingSettingsSchema>
