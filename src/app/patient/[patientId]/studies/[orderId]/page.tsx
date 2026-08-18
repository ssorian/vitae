import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge } from '#/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { resultStatusLabel, studyTypeLabels } from '#/modules/patient/profile'
import { requirePatientOwnership } from '#/modules/patient/requirePatientOwnership'
import { getOwnedPatientStudy } from '#/modules/patient/server/profile'

type StudyPageProps = { params: Promise<{ patientId: string; orderId: string }> }

const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })

export default async function PatientStudyPage({ params }: StudyPageProps) {
  const [{ patientId, orderId }, ownership] = await Promise.all([params, requirePatientOwnership()])
  const study = await getOwnedPatientStudy(patientId, ownership.patientId, orderId)
  if (!study) notFound()

  return <main className="mx-auto max-w-3xl space-y-6 p-6">
    <header><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/patient/${patientId}`}>Volver a mi perfil</Link><p className="mt-4 text-sm text-muted-foreground">Folio {study.folio}</p><h1 className="text-2xl font-semibold">{studyTypeLabels[study.type] ?? study.type}</h1></header>
    <Card><CardHeader><CardTitle>Estudio</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><span className="font-medium">Clínica:</span> {study.clinicName}</p><p><span className="font-medium">Solicitado:</span> {dateFormat.format(study.createdAt)}</p><Badge variant={study.status === 'ready' || study.status === 'delivered' ? 'secondary' : 'outline'}>{resultStatusLabel(study.status, Boolean(study.resultFinalizedAt))}</Badge></CardContent></Card>
    {study.resultFinalizedAt && <Card><CardHeader><CardTitle>Resultado</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="whitespace-pre-wrap">{study.observations || 'Sin observaciones.'}</p>{study.resultRealizedAt && <p className="text-muted-foreground">Realizado: {dateFormat.format(study.resultRealizedAt)}</p>}{study.assets.length > 0 && <section className="space-y-2"><h2 className="font-medium">Archivos</h2><ul className="space-y-2">{study.assets.map((asset) => <li key={asset.id} className="flex items-center justify-between rounded border p-3"><span>{asset.name} <span className="text-xs text-muted-foreground">({asset.type.toUpperCase()})</span></span><a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/api/patient/${patientId}/studies/${orderId}/assets/${asset.id}`}>Abrir archivo</a></li>)}</ul></section>}</CardContent></Card>}
  </main>
}
