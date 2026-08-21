import { orderStudyTypes } from './schemas/studyCatalog'

type StudyType = (typeof orderStudyTypes)[number]
type Props = { type: StudyType; details: Record<string, unknown> }
const labels: Record<string, string> = { radiography: 'Radiografía', radiography_2d: 'Radiografía 2D', cbct: 'CBCT', cephalometric_analysis: 'Análisis cefalométrico', study_models: 'Modelos de estudio', intraoral_scan: 'Escaneo intraoral', orthodontic_package: 'Paquete ortodóncico', aligner_package: 'Paquete de alineadores', laboratory_order: 'Orden de laboratorio', endodontic_evaluation: 'Evaluación endodóntica' }
const display = (value: unknown): string => Array.isArray(value) ? value.map(display).join(', ') : value && typeof value === 'object' ? Object.entries(value).map(([key, item]) => `${key}: ${display(item)}`).join('; ') : value === true ? 'Sí' : value === false ? 'No' : String(value ?? '—')

export function StudyDetailsSummary({ type, details }: Props) {
  return <div className="space-y-1 text-sm"><p><span className="font-medium">Estudio:</span> {labels[type]}</p>{Object.entries(details).filter(([, value]) => value !== '' && value !== undefined).map(([key, value]) => <p key={key}><span className="font-medium">{key}:</span> {display(value)}</p>)}</div>
}
