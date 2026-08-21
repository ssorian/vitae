import { z } from 'zod'

const text = z.string().trim().min(1).max(2000)
const optionalText = z.string().trim().max(2000).optional()
const toothNumbers = z.array(z.string().trim().min(1).max(8)).min(1).max(32)

export const orderStudyTypes = [
  'radiography',
  'radiography_2d',
  'cbct',
  'cephalometric_analysis',
  'study_models',
  'intraoral_scan',
  'orthodontic_package',
  'aligner_package',
  'laboratory_order',
  'endodontic_evaluation',
] as const
export const orderStudyTypeSchema = z.enum(orderStudyTypes)
export const publicStudyTypes = orderStudyTypes.filter((type) => type !== 'endodontic_evaluation')

// Legacy orders remain readable with their original payload shape.
export const radiographyDetailsSchema = z.object({
  radiographyType: text,
  region: text,
  clinicalIndication: text,
  notes: optionalText,
})

const cbctFov = z.enum(['4x4', '5x5', '8x5', '8x8', '10x9', '12x9', '15x9', '15x15'])
const cbctRegion = z.enum(['teeth', 'maxilla', 'mandible', 'maxilla_mandible', 'tmj', 'airways', 'paranasal_sinuses', 'facial_skeleton'])
type CbctFov = z.infer<typeof cbctFov>
type CbctRegion = z.infer<typeof cbctRegion>
const cbctRegionsByFov: Record<CbctFov, CbctRegion[]> = { '4x4': ['teeth'], '5x5': ['teeth'], '8x5': ['maxilla', 'mandible'], '8x8': ['maxilla_mandible'], '10x9': ['maxilla_mandible'], '12x9': ['maxilla_mandible'], '15x9': ['tmj', 'airways', 'paranasal_sinuses'], '15x15': ['facial_skeleton'] }
export const cbctDetailsSchema = z.object({
  fov: cbctFov,
  region: z.union([cbctRegion, z.array(cbctRegion).min(1)]),
  toothNumbers: toothNumbers.optional(),
  amperage: z.enum(['normal', 'high']).optional(),
  tmjPosition: z.enum(['occlusion', 'opening', 'both']).optional(),
  regionOfInterestNotes: optionalText,
}).superRefine((value, context) => {
  const regions = Array.isArray(value.region) ? value.region : [value.region]
  const allowedRegions = cbctRegionsByFov[value.fov]
  if (!regions.every((region) => allowedRegions.includes(region)) || (value.fov !== '15x9' && regions.length !== 1)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['region'], message: 'La región no corresponde al campo de visión.' })
  if (['4x4', '5x5'].includes(value.fov)) {
    if (!value.toothNumbers || value.toothNumbers.length > 3) context.addIssue({ code: z.ZodIssueCode.custom, path: ['toothNumbers'], message: 'Selecciona de 1 a 3 dientes.' })
    if (!value.amperage) context.addIssue({ code: z.ZodIssueCode.custom, path: ['amperage'], message: 'Selecciona el amperaje.' })
  }
  if (regions.includes('tmj') && !value.tmjPosition) context.addIssue({ code: z.ZodIssueCode.custom, path: ['tmjPosition'], message: 'Selecciona la posición de ATM.' })
})

export const radiography2dDefaults = (variant: 'panoramic_insight' | 'panoramic' | 'half_panoramic' | 'lateral_cephalometric' | 'tmj_open_closed_lateral' | 'paranasal_sinuses' | 'caldwell_hirtz' | 'waters' | 'pa_ap' | 'carpal') => {
  switch (variant) {
    case 'half_panoramic': case 'carpal': return { variant, side: 'left' as const }
    case 'lateral_cephalometric': return { variant, scope: 'complete' as const }
    case 'waters': return { variant, mouthPosition: 'open' as const }
    case 'pa_ap': return { variant, projection: 'PA' as const }
    default: return { variant }
  }
}

export const radiography2dDetailsSchema = z.discriminatedUnion('variant', [
  z.object({ variant: z.literal('panoramic_insight') }),
  z.object({ variant: z.literal('panoramic') }),
  z.object({ variant: z.literal('half_panoramic'), side: z.enum(['left', 'right']) }),
  z.object({ variant: z.literal('lateral_cephalometric'), scope: z.enum(['complete', 'profile_only']) }),
  z.object({ variant: z.literal('tmj_open_closed_lateral') }),
  z.object({ variant: z.literal('paranasal_sinuses') }),
  z.object({ variant: z.literal('caldwell_hirtz') }),
  z.object({ variant: z.literal('waters'), mouthPosition: z.enum(['open', 'closed']) }),
  z.object({ variant: z.literal('pa_ap'), projection: z.enum(['PA', 'AP']) }),
  z.object({ variant: z.literal('carpal'), side: z.enum(['left', 'right']) }),
])
export const cephalometricAnalysisDetailsSchema = z.object({ analyses: z.array(z.enum(['steiner', 'jarabak', 'ricketts', 'ricketts_summary', 'custom'])).min(1), customTechnique: optionalText }).superRefine((value, context) => { if (value.analyses.includes('custom') && !value.customTechnique) context.addIssue({ code: z.ZodIssueCode.custom, path: ['customTechnique'], message: 'Describe la técnica personalizada.' }) })
export const studyModelsDetailsSchema = z.object({ material: z.enum(['orthodontic_plaster', 'resin']) })
export const intraoralScanDetailsSchema = z.object({ outputFormat: z.literal('STL') })
export const orthodonticPackageDetailsSchema = z.object({ package: z.enum(['complete', 'complete_3d']), lateralScope: z.enum(['complete', 'profile_only']), cephalometricTechnique: optionalText, modelMaterial: z.enum(['orthodontic_plaster', 'resin']), cbct: z.object({ fov: z.enum(['10x9', '12x9', '15x9', '15x15']) }).optional() }).superRefine((value, context) => { if (value.package === 'complete_3d' && !value.cbct) context.addIssue({ code: z.ZodIssueCode.custom, path: ['cbct'], message: 'El paquete 3D requiere CBCT.' }); if (value.package === 'complete' && value.cbct) context.addIssue({ code: z.ZodIssueCode.custom, path: ['cbct'], message: 'CBCT solo aplica al paquete 3D.' }) })
export const alignerPackageDetailsSchema = z.object({ tomography: z.boolean(), lateral: z.boolean(), intraoralScanStl: z.boolean(), cephalometry: z.boolean(), models: z.boolean(), panoramic: z.boolean(), clinicalPhotography: z.boolean(), tomographyFov: z.enum(['4x4', '5x5', '8x5', '8x8', '10x9', '12x9', '15x9', '15x15']).optional(), lateralScope: z.enum(['complete', 'profile_only']).optional(), cephalometricTechnique: optionalText, modelMaterial: z.enum(['orthodontic_plaster', 'resin']).optional() }).superRefine((value, context) => { if (value.tomography && !value.tomographyFov) context.addIssue({ code: z.ZodIssueCode.custom, path: ['tomographyFov'], message: 'Selecciona el FOV.' }); if (value.lateral && !value.lateralScope) context.addIssue({ code: z.ZodIssueCode.custom, path: ['lateralScope'], message: 'Selecciona el alcance lateral.' }); if (value.cephalometry && !value.cephalometricTechnique) context.addIssue({ code: z.ZodIssueCode.custom, path: ['cephalometricTechnique'], message: 'Indica la técnica cefalométrica.' }); if (value.models && !value.modelMaterial) context.addIssue({ code: z.ZodIssueCode.custom, path: ['modelMaterial'], message: 'Selecciona el material.' }) })
export const laboratoryOrderDetailsSchema = z.object({ work: text, receivedAt: z.string().date().optional(), deliveryAt: z.string().date().optional(), impression: z.enum(['analog', 'digital']).optional(), antagonist: z.enum(['upper', 'lower']).optional(), biteRegistration: z.enum(['analog', 'digital']).optional(), prototype: z.boolean().optional(), photos: z.boolean().optional(), other: optionalText, shade: z.object({ system: z.enum(['vita', 'chromascop']).optional(), substrate: optionalText, final: optionalText, colorimeter: optionalText }).optional(), toothNumbers, material: z.enum(['emax', 'zirconia', 'feldspathic', 'wax_up', 'pmma', 'splint', 'surgical_guide', 'periodontal_surgical_guide']).optional(), materialVariant: z.enum(['mono', 'estra']).optional(), implant: z.object({ brand: optionalText, diameter: optionalText, attachments: z.array(z.object({ name: text, quantity: z.number().int().positive() })), customized: z.boolean().optional(), bar: optionalText }).optional() })
export const endodonticEvaluationDetailsSchema = z.object({ toothNumber: z.string().trim().min(1).max(8), anatomicalCrown: optionalText, inflammation: optionalText, gingivitis: optionalText, calculus: optionalText, fistula: optionalText, fistulaLocation: optionalText, pain: optionalText, percussion: optionalText, palpation: optionalText, periodontalPockets: optionalText, probing: optionalText, mobility: optionalText, pulpChamber: optionalText, canals: z.array(z.object({ canal: text, characteristics: optionalText, tentativeLength: z.number().positive().optional(), workingLength: z.number().positive().optional(), guttaPerchaPoint: optionalText })).min(1), radiographicLesions: optionalText, rootFracture: optionalText, calcification: optionalText, resorption: optionalText, periodontalLigament: optionalText, pulpalDiagnosis: optionalText, periapicalDiagnosis: optionalText, treatmentPlan: optionalText, instrumentationTechnique: optionalText, obturationTechnique: optionalText, irrigatingAgent: optionalText, postEndodonticRestoration: optionalText })

export const studyDetailsSchemaByType = {
  radiography: radiographyDetailsSchema,
  radiography_2d: radiography2dDetailsSchema,
  cbct: cbctDetailsSchema,
  cephalometric_analysis: cephalometricAnalysisDetailsSchema,
  study_models: studyModelsDetailsSchema,
  intraoral_scan: intraoralScanDetailsSchema,
  orthodontic_package: orthodonticPackageDetailsSchema,
  aligner_package: alignerPackageDetailsSchema,
  laboratory_order: laboratoryOrderDetailsSchema,
  endodontic_evaluation: endodonticEvaluationDetailsSchema,
} as const
