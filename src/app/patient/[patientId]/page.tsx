import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge } from '#/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { appointmentStatusLabels, resultStatusLabel, studyTypeLabels } from '#/modules/patient/profile'
import { requirePatientOwnership } from '#/modules/patient/requirePatientOwnership'
import { getOwnedPatientProfile } from '#/modules/patient/server/profile'

type PatientPageProps = { params: Promise<{ patientId: string }> }

const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
const dateTimeFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export default async function PatientPage({ params }: PatientPageProps) {
  const [{ patientId }, ownership] = await Promise.all([params, requirePatientOwnership()])
  const profile = await getOwnedPatientProfile(patientId, ownership.patientId)
  if (!profile) notFound()

  const name = [profile.identity.firstName, profile.identity.paternalLastName, profile.identity.maternalLastName].filter(Boolean).join(' ')

  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm text-muted-foreground">Mi perfil</p><h1 className="text-2xl font-semibold">{name}</h1></header>
    <Card><CardHeader><CardTitle>Datos personales</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="font-medium">Fecha de nacimiento:</span> {profile.identity.birthDate ? dateFormat.format(new Date(profile.identity.birthDate)) : '—'}</p><p><span className="font-medium">Teléfono:</span> {profile.identity.phone ?? '—'}</p><p><span className="font-medium">Correo:</span> {profile.identity.email ?? '—'}</p></CardContent></Card>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Próximas citas</h2>{profile.upcoming.length ? <div className="grid gap-3">{profile.upcoming.map((item) => <Card key={item.id} size="sm"><CardContent className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{item.kind === 'study' ? 'Estudio' : 'Consulta'} · {item.clinicName}</p><p className="text-sm text-muted-foreground">{dateTimeFormat.format(item.startsAt)}</p></div><Badge variant="secondary">{appointmentStatusLabels[item.status] ?? item.status}</Badge></CardContent></Card>)}</div> : <p className="text-sm text-muted-foreground">No tenés citas próximas.</p>}</section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Historial de citas</h2>{profile.history.length ? <div className="grid gap-3">{profile.history.map((item) => <Card key={item.id} size="sm"><CardContent className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{item.kind === 'study' ? 'Estudio' : 'Consulta'} · {item.clinicName}</p><p className="text-sm text-muted-foreground">{dateTimeFormat.format(item.startsAt)}</p></div><Badge variant="outline">{appointmentStatusLabels[item.status] ?? item.status}</Badge></CardContent></Card>)}</div> : <p className="text-sm text-muted-foreground">Todavía no hay citas en tu historial.</p>}</section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Órdenes de estudio</h2>{profile.orders.length ? <div className="grid gap-3">{profile.orders.map((item) => <Card key={item.id} size="sm"><CardContent className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{studyTypeLabels[item.type] ?? item.type} · {item.clinicName}</p><p className="text-sm text-muted-foreground">Folio {item.folio} · {dateFormat.format(item.createdAt)}</p></div><div className="flex items-center gap-3"><Badge variant={item.status === 'ready' || item.status === 'delivered' ? 'secondary' : 'outline'}>{resultStatusLabel(item.status, Boolean(item.resultFinalizedAt))}</Badge><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/patient/${patientId}/studies/${item.id}`}>Ver estudio</Link></div></CardContent></Card>)}</div> : <p className="text-sm text-muted-foreground">No tenés órdenes de estudio.</p>}</section>
  </main>
}
