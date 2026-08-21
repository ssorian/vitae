import { z } from 'zod'

export function normalizePatientContact(input: { phone?: string | null; email?: string | null }) {
  return {
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone?.replace(/\D/g, '') || null,
  }
}

export const newPatientInputSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  paternalLastName: z.string().trim().min(1, 'El apellido paterno es obligatorio').max(100),
  maternalLastName: z.string().trim().max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento no es válida').optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email('El correo electrónico no es válido').max(254).optional(),
}).superRefine((value, context) => {
  if (!value.phone?.replace(/\D/g, '') && !value.email) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Se requiere teléfono o correo.' })
  }
})

export const createPatientInputSchema = z.object({
  clinicId: z.uuid(),
  patient: newPatientInputSchema,
  createNewAnyway: z.boolean().default(false),
})

export type NewPatientInput = z.infer<typeof newPatientInputSchema>
