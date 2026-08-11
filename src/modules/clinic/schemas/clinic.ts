import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional()

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
  slotIntervalMinutes: z.number().int().min(5).max(120).default(15),
  status: z.enum(['active', 'inactive']),
})

export const clinicIdSchema = z.object({
  id: z.uuid(),
})

export const updateClinicSchema = clinicInputSchema.extend({
  id: z.uuid(),
})

export type ClinicInput = z.infer<typeof clinicInputSchema>
