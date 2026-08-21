import { z } from 'zod'

export { cbctDetailsSchema, radiographyDetailsSchema } from './studyCatalog'
import { alignerPackageDetailsSchema, cbctDetailsSchema, cephalometricAnalysisDetailsSchema, endodonticEvaluationDetailsSchema, intraoralScanDetailsSchema, laboratoryOrderDetailsSchema, orthodonticPackageDetailsSchema, radiography2dDetailsSchema, radiographyDetailsSchema, studyModelsDetailsSchema } from './studyCatalog'

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

const studyTypes = ['radiography', 'radiography_2d', 'cbct', 'cephalometric_analysis', 'study_models', 'intraoral_scan', 'orthodontic_package', 'aligner_package', 'laboratory_order', 'endodontic_evaluation'] as const
export const orderGeneralSchema = z.object({ type: z.enum(studyTypes), doctor: doctorClientSchema, patient: patientSchema })

const orderVariant = <T extends typeof studyTypes[number], S extends z.ZodTypeAny>(type: T, details: S) => z.object({ type: z.literal(type), doctor: doctorClientSchema, patient: patientSchema, clinicId: z.string().uuid('La clínica es obligatoria'), details }).strict()
const professionalOrderVariant = <T extends typeof studyTypes[number], S extends z.ZodTypeAny>(type: T, details: S) => z.object({ type: z.literal(type), patient: patientSchema, clinicId: z.string().uuid('La clínica es obligatoria'), details }).strict()

export const createOrderSchema = z.union([
  orderVariant('radiography', radiographyDetailsSchema), orderVariant('radiography_2d', radiography2dDetailsSchema), orderVariant('cbct', cbctDetailsSchema), orderVariant('cephalometric_analysis', cephalometricAnalysisDetailsSchema), orderVariant('study_models', studyModelsDetailsSchema), orderVariant('intraoral_scan', intraoralScanDetailsSchema), orderVariant('orthodontic_package', orthodonticPackageDetailsSchema), orderVariant('aligner_package', alignerPackageDetailsSchema), orderVariant('laboratory_order', laboratoryOrderDetailsSchema), orderVariant('endodontic_evaluation', endodonticEvaluationDetailsSchema),
])
// The requesting professional is derived from the authenticated server session.
export const authenticatedProfessionalOrderSchema = z.union([
  professionalOrderVariant('radiography', radiographyDetailsSchema), professionalOrderVariant('radiography_2d', radiography2dDetailsSchema), professionalOrderVariant('cbct', cbctDetailsSchema), professionalOrderVariant('cephalometric_analysis', cephalometricAnalysisDetailsSchema), professionalOrderVariant('study_models', studyModelsDetailsSchema), professionalOrderVariant('intraoral_scan', intraoralScanDetailsSchema), professionalOrderVariant('orthodontic_package', orthodonticPackageDetailsSchema), professionalOrderVariant('aligner_package', alignerPackageDetailsSchema), professionalOrderVariant('laboratory_order', laboratoryOrderDetailsSchema), professionalOrderVariant('endodontic_evaluation', endodonticEvaluationDetailsSchema),
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
