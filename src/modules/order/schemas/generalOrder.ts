import { z } from 'zod'

export const doctorClientSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  paternalLastName: z.string().trim().min(1, 'El apellido paterno es obligatorio').max(100),
  maternalLastName: z.string().trim().max(100).optional(),
  professionalLicense: z.string().trim().max(50).optional(),
  specialty: z.string().trim().max(150).optional(),
  clinicName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email('Correo electrónico inválido'),
})

export const patientSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(100),

  paternalLastName: z
    .string()
    .trim()
    .max(100)
    .optional(),

  maternalLastName: z
    .string()
    .trim()
    .max(100)
    .optional(),

  birthDate: z
    .string()
    .optional(),

  sex: z
    .enum([
      'male',
      'female',
      'other',
      'unspecified',
    ])
    .optional(),

  phone: z
    .string()
    .trim()
    .max(20)
    .optional(),

  email: z
    .union([
      z.string().trim().email('Correo electrónico inválido'),
      z.literal(''),
    ])
    .optional(),
})

export const radiographyDetailsSchema = z.object({
  radiographyType: z.string().trim().min(1, 'El tipo de radiografía es obligatorio'),
  region: z.string().trim().min(1, 'La pieza o región es obligatoria'),
  clinicalIndication: z.string().trim().min(1, 'La indicación clínica es obligatoria'),
  notes: z.string().trim().optional(),
})

export const cbctDetailsSchema = z.object({
  anatomicalRegion: z.string().trim().min(1, 'La región anatómica es obligatoria'),
  specificArea: z.string().trim().min(1, 'El área específica es obligatoria'),
  clinicalIndication: z.string().trim().min(1, 'La indicación clínica es obligatoria'),
  notes: z.string().trim().optional(),
})

export const orderGeneralSchema = z.object({
  type: z.enum([
    'radiography',
    'cbct',
  ]),

  doctor: doctorClientSchema,

  patient: patientSchema,
})

export const createOrderSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('radiography'),
    doctor: doctorClientSchema,
    patient: patientSchema,
    clinicId: z.string().uuid('La clínica es obligatoria'),
    details: radiographyDetailsSchema,
  }),
  z.object({
    type: z.literal('cbct'),
    doctor: doctorClientSchema,
    patient: patientSchema,
    clinicId: z.string().uuid('La clínica es obligatoria'),
    details: cbctDetailsSchema,
  }),
])

// The requesting professional is derived from the authenticated server session.
// This browser payload intentionally has no doctor identity or profile fields.
export const authenticatedProfessionalOrderSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('radiography'),
    patient: patientSchema,
    clinicId: z.string().uuid('La clínica es obligatoria'),
    details: radiographyDetailsSchema,
  }).strict(),
  z.object({
    type: z.literal('cbct'),
    patient: patientSchema,
    clinicId: z.string().uuid('La clínica es obligatoria'),
    details: cbctDetailsSchema,
  }).strict(),
])

export type DoctorClientInput =
  z.infer<typeof doctorClientSchema>

export type PatientInput =
  z.infer<typeof patientSchema>

export type OrderGeneralInput =
  z.infer<typeof orderGeneralSchema>

export type RadiographyDetailsInput =
  z.infer<typeof radiographyDetailsSchema>

export type CBCTDetailsInput =
  z.infer<typeof cbctDetailsSchema>

export type CreateOrderInput =
  z.infer<typeof createOrderSchema>

export type AuthenticatedProfessionalOrderInput =
  z.infer<typeof authenticatedProfessionalOrderSchema>
