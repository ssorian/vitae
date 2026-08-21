import { z } from 'zod'

export function normalizeDoctorClientEmail(value: string) {
  return value.trim().toLowerCase()
}

export function normalizeDoctorClientPhone(value: string | null | undefined) {
  return value?.replace(/\D/g, '') || null
}

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null)

export const doctorClientSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  paternalLastName: z.string().trim().min(1, 'El apellido paterno es obligatorio').max(100),
  maternalLastName: optionalText(100),
  // Licenses are identifiers: trim only; preserve case and punctuation.
  professionalLicense: optionalText(50),
  specialty: optionalText(100),
  clinicName: optionalText(150),
  phone: z.string().trim().max(30).optional().transform(normalizeDoctorClientPhone),
  email: z.string().trim().email('Correo electrónico inválido').transform(normalizeDoctorClientEmail),
})

export type DoctorClientInput = z.infer<typeof doctorClientSchema>

export const clientOnboardingSchema = doctorClientSchema.omit({ email: true })
export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>
