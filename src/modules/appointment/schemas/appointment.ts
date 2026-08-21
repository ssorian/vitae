import { z } from 'zod'
import { doctorClientSchema } from '#/modules/order/schemas/generalOrder'
import { alignerPackageDetailsSchema, cbctDetailsSchema, cephalometricAnalysisDetailsSchema, intraoralScanDetailsSchema, laboratoryOrderDetailsSchema, orthodonticPackageDetailsSchema, radiography2dDetailsSchema, radiographyDetailsSchema, studyModelsDetailsSchema } from '#/modules/order/schemas/studyCatalog'
import { newPatientInputSchema, normalizePatientContact } from '#/modules/patient/schemas/patient'

export { normalizePatientContact }

const uuid = z.uuid()
const appointmentSlotInputSchema = z.object({ clinicId: uuid, startsAt: z.coerce.date(), endsAt: z.coerce.date(), notes: z.string().trim().max(2000).optional(), status: z.enum(['requested', 'scheduled']).default('scheduled') }).refine((value) => value.startsAt < value.endsAt, 'La cita debe tener duración positiva')
export const availabilityInputSchema = z.object({ clinicId: uuid, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), durationMinutes: z.number().int().positive() })
export const appointmentInputSchema = z.union([appointmentSlotInputSchema.extend({ patientId: uuid }), appointmentSlotInputSchema.extend({ patient: newPatientInputSchema, createNewAnyway: z.boolean().default(false) })])
export const rescheduleInputSchema = appointmentSlotInputSchema.extend({ patientId: uuid, id: uuid })
export const appointmentStatusInputSchema = z.object({ id: uuid, status: z.enum(['requested', 'scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'rejected', 'no_show']) })
export const scheduleOrderInputSchema = z.object({ orderId: uuid, startsAt: z.coerce.date(), endsAt: z.coerce.date() }).refine((v) => v.startsAt < v.endsAt, 'La cita debe tener duración positiva')

const publicText = z.string().trim().min(1).max(120)
export const publicAvailabilityInputSchema = z.object({ clinicPublicSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
export const publicBookingInputSchema = z.object({ clinicPublicSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160), startsAt: z.coerce.date(), firstName: publicText, paternalLastName: z.string().trim().max(120).optional(), maternalLastName: z.string().trim().max(120).optional(), phone: z.string().trim().max(40).optional(), email: z.string().trim().email().max(254).optional() }).superRefine((value, context) => { if (!value.phone?.replace(/[^0-9]/g, '') && !value.email) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Se requiere teléfono o correo.' }) })
const publicExistingPatientInputSchema = z.object({ clinicPublicSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160), startsAt: z.coerce.date(), phone: z.string().trim().max(40).optional(), email: z.string().trim().email().max(254).optional() }).superRefine((value, context) => { if (!value.phone?.replace(/[^0-9]/g, '') && !value.email) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Se requiere teléfono o correo.' }) })
export const publicExistingBookingInputSchema = publicExistingPatientInputSchema
const publicStudyVariant = <T extends string, S extends z.ZodTypeAny>(type: T, details: S) => publicBookingInputSchema.extend({ type: z.literal(type), details, doctor: doctorClientSchema.optional() })
const existingPublicStudyVariant = <T extends string, S extends z.ZodTypeAny>(type: T, details: S) => publicExistingPatientInputSchema.extend({ type: z.literal(type), details, doctor: doctorClientSchema.optional() })
export const publicStudyBookingInputSchema = z.union([
  publicStudyVariant('radiography', radiographyDetailsSchema), publicStudyVariant('radiography_2d', radiography2dDetailsSchema), publicStudyVariant('cbct', cbctDetailsSchema), publicStudyVariant('cephalometric_analysis', cephalometricAnalysisDetailsSchema), publicStudyVariant('study_models', studyModelsDetailsSchema), publicStudyVariant('intraoral_scan', intraoralScanDetailsSchema), publicStudyVariant('orthodontic_package', orthodonticPackageDetailsSchema), publicStudyVariant('aligner_package', alignerPackageDetailsSchema), publicStudyVariant('laboratory_order', laboratoryOrderDetailsSchema),
])
export const publicExistingStudyBookingInputSchema = z.union([
  existingPublicStudyVariant('radiography', radiographyDetailsSchema), existingPublicStudyVariant('radiography_2d', radiography2dDetailsSchema), existingPublicStudyVariant('cbct', cbctDetailsSchema), existingPublicStudyVariant('cephalometric_analysis', cephalometricAnalysisDetailsSchema), existingPublicStudyVariant('study_models', studyModelsDetailsSchema), existingPublicStudyVariant('intraoral_scan', intraoralScanDetailsSchema), existingPublicStudyVariant('orthodontic_package', orthodonticPackageDetailsSchema), existingPublicStudyVariant('aligner_package', alignerPackageDetailsSchema), existingPublicStudyVariant('laboratory_order', laboratoryOrderDetailsSchema),
])
