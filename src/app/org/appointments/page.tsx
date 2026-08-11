'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'
import { createAppointmentAction, listAgendaAction, listPatientsAction, listResourcesAction } from '#/modules/appointment/server/appointment'
import { listClinicsAction } from '#/modules/clinic/server/clinic'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/shared/components/ui/dialog'

type Agenda = Awaited<ReturnType<typeof listAgendaAction>>
type Patients = Awaited<ReturnType<typeof listPatientsAction>>
type Resources = Awaited<ReturnType<typeof listResourcesAction>>

export default function AppointmentsPage() {
  const [clinics, setClinics] = useState<Awaited<ReturnType<typeof listClinicsAction>>>([])
  const [clinicId, setClinicId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [appointments, setAppointments] = useState<Agenda>([])
  const [patients, setPatients] = useState<Patients | null>(null)
  const [formClinicId, setFormClinicId] = useState('')
  const [resources, setResources] = useState<Resources>([])
  const [startAt, setStartAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [resourceIds, setResourceIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const load = useCallback(async () => setAppointments(await listAgendaAction(clinicId || undefined, date)), [clinicId, date])

  useEffect(() => { void listClinicsAction().then(setClinics) }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => { void listPatientsAction().then(setPatients).catch(() => setPatients(null)) }, [])
  useEffect(() => {
    setResourceIds([])
    if (!formClinicId) { setResources([]); return }
    void listResourcesAction(formClinicId, true).then(setResources).catch(() => setResources([]))
  }, [formClinicId])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!resourceIds.length) { setError('Selecciona al menos un recurso.'); return }
    const startsAt = new Date(startAt)
    const endsAt = new Date(startsAt.getTime() + Number(durationMinutes) * 60_000)
    if (Number.isNaN(startsAt.getTime()) || endsAt <= startsAt) { setError('Ingresa una fecha y duración válidas.'); return }
    setSaving(true)
    setError('')
    try {
      await createAppointmentAction({ clinicId: formClinicId, patientId: new FormData(form).get('patientId'), startsAt, endsAt, resourceIds, notes: new FormData(form).get('notes') || undefined, status: new FormData(form).get('status') })
      await load()
      form.reset()
      setFormClinicId('')
      setStartAt('')
      setDurationMinutes('30')
      setResourceIds([])
      setDialogOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la cita.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        {patients !== null && <Button onClick={() => setDialogOpen(true)}>Nueva cita</Button>}
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="h-9 rounded-md border bg-background px-3" value={clinicId} onChange={(event) => setClinicId(event.target.value)}>
          <option value="">Todas las clínicas</option>
          {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
        </select>
        <input className="h-9 rounded-md border bg-background px-3" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-[8rem_1fr_9rem] gap-3 border-b px-4 py-2 text-xs font-medium text-muted-foreground"><span>Hora</span><span>Cita</span><span>Estado</span></div>
        {appointments.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No hay citas para este filtro.</p> : appointments.map((item) => <div key={item.id} className="grid grid-cols-[8rem_1fr_9rem] gap-3 border-b px-4 py-3 text-sm"><span>{new Date(item.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span><span>{item.kind === 'study' ? 'Estudio' : 'Cita clínica'}{item.notes ? ` — ${item.notes}` : ''}</span><span>{item.status}</span></div>)}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nueva cita</DialogTitle></DialogHeader>
          {patients !== null && <form className="space-y-4" onSubmit={submit}><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm">Clínica<select className="h-9 w-full rounded-md border bg-background px-3" value={formClinicId} onChange={(event) => setFormClinicId(event.target.value)} required><option value="">Selecciona una clínica</option>{clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}</select></label><label className="space-y-1 text-sm">Paciente<select className="h-9 w-full rounded-md border bg-background px-3" name="patientId" required><option value="">Selecciona un paciente</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{[patient.firstName, patient.paternalLastName, patient.maternalLastName].filter(Boolean).join(' ')}</option>)}</select></label><label className="space-y-1 text-sm">Inicio<input className="h-9 w-full rounded-md border bg-background px-3" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required /></label><label className="space-y-1 text-sm">Duración (minutos)<input className="h-9 w-full rounded-md border bg-background px-3" type="number" min="1" step="1" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} required /></label></div><fieldset className="space-y-2"><legend className="text-sm">Recursos activos</legend>{!formClinicId ? <p className="text-sm text-muted-foreground">Selecciona una clínica.</p> : resources.length === 0 ? <p className="text-sm text-muted-foreground">No hay recursos activos.</p> : resources.map((resource) => <label className="mr-4 inline-flex items-center gap-2 text-sm" key={resource.id}><input type="checkbox" checked={resourceIds.includes(resource.id)} onChange={(event) => setResourceIds((ids) => event.target.checked ? [...ids, resource.id] : ids.filter((id) => id !== resource.id))} />{resource.name}</label>)}</fieldset><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm">Notas<textarea className="min-h-20 w-full rounded-md border bg-background p-3" name="notes" maxLength={2000} /></label><fieldset className="space-y-2"><legend className="text-sm">Estado</legend><label className="mr-4 inline-flex items-center gap-2 text-sm"><input type="radio" name="status" value="scheduled" defaultChecked />Programada</label><label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="status" value="requested" />Solicitada</label></fieldset></div>{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<Button disabled={saving} type="submit">{saving ? 'Guardando…' : 'Crear cita'}</Button></form>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
