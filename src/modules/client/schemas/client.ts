// src/modules/client/schemas/client-onboarding.schema.ts

import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional()

export const clientOnboardingSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(100),

  paternalLastName: z
    .string()
    .trim()
    .min(1, 'El apellido paterno es obligatorio')
    .max(100),

  maternalLastName: optionalText(100),

  professionalLicense: optionalText(50),

  specialty: optionalText(100),

  clinicName: optionalText(150),

  phone: optionalText(30),
})

export type ClientOnboardingInput =
  z.infer<typeof clientOnboardingSchema>