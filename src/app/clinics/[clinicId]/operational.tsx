'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/shared/components/ui/dialog'
import { createAppointmentAction, listAgendaAction, listPatientsAction, transitionAppointmentAction } from '#/modules/appointment/server/appointment'
import { issuePatientPortalInvitationAction, revokePatientPortalInvitationAction } from '#/modules/patient/server/portal'

type PatientMatch = { id: string; firstName: string; paternalLastName: string | null; maternalLastName: string | null; phone: string | null; email: string | null }
import { listOrdersAction, updateOrderStatusAction } from '#/modules/order/server/generalOrder'

type View = 'overview' | 'agenda' | 'patients' | 'orders'
type Props = { clinicId: string; laboratoryEnabled: boolean; view: View }

const appointmentStatus: Record<string, string> = { scheduled: 'Programada', requested: 'Solicitada', checked_in: 'En clínica', in_progress: 'En atención', completed: 'Completada', cancelled: 'Cancelada' }
const orderStatus: Record<string, string> = { draft: 'Borrador', received: 'Recibida', scheduled: 'Agendada', in_progress: 'En proceso', ready: 'Lista', delivered: 'Entregada', cancelled: 'Cancelada' }

function patientName(patient: { firstName: string; paternalLastName?: string | null; maternalLastName?: string | null }) {
  return [patient.firstName, patient.paternalLastName, patient.maternalLastName].filter(Boolean).join(' ')
}

export function ClinicOperations({ clinicId, laboratoryEnabled, view }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [agenda, setAgenda] = useState<Awaited<ReturnType<typeof listAgendaAction>>>([])
  const [patients, setPatients] = useState<Awaited<ReturnType<typeof listPatientsAction>>>([])
  
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof listOrdersAction>>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState({ patientId: '', startsAt: '', duration: '30', notes: '', status: 'scheduled' as 'requested' | 'scheduled', patientMode: 'existing' as 'existing' | 'new', firstName: '', paternalLastName: '', maternalLastName: '', birthDate: '', phone: '', email: '' })
  const [possibleMatches, setPossibleMatches] = useState<PatientMatch[]>([])
  const [appointmentError, setAppointmentError] = useState('')
  const [isSavingAppointment, setIsSavingAppointment] = useState(false)
  const [portalLink, setPortalLink] = useState('')
  const [portalError, setPortalError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [nextAgenda, nextPatients, nextOrders] = await Promise.all([
        listAgendaAction(clinicId, date),
        listPatientsAction(clinicId),
        
        laboratoryEnabled ? listOrdersAction(clinicId) : Promise.resolve([]),
      ])
      setAgenda(nextAgenda)
      setPatients(nextPatients)
      
      setOrders(nextOrders)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la operación.')
    } finally {
      setIsLoading(false)
    }
  }, [clinicId, date, laboratoryEnabled])

  useEffect(() => { void load() }, [load])

  function resetAppointmentForm() {
    setAppointmentForm({ patientId: '', startsAt: '', duration: '30', notes: '', status: 'scheduled', patientMode: 'existing', firstName: '', paternalLastName: '', maternalLastName: '', birthDate: '', phone: '', email: '' })
    setPossibleMatches([])
    setAppointmentError('')
  }

  function handleAppointmentDialogChange(open: boolean) {
    if (isSavingAppointment) return
    setIsAppointmentDialogOpen(open)
    if (!open) resetAppointmentForm()
  }

  async function saveAppointment(createNewAnyway = false) {
    const start = new Date(appointmentForm.startsAt)
    const duration = Number(appointmentForm.duration)
    const newPatient = { firstName: appointmentForm.firstName, paternalLastName: appointmentForm.paternalLastName, maternalLastName: appointmentForm.maternalLastName || undefined, birthDate: appointmentForm.birthDate || undefined, phone: appointmentForm.phone || undefined, email: appointmentForm.email || undefined }
    if (!appointmentForm.startsAt || Number.isNaN(start.getTime()) || !Number.isFinite(duration) || duration <= 0 || (appointmentForm.patientMode === 'existing' && !appointmentForm.patientId) || (appointmentForm.patientMode === 'new' && (!newPatient.firstName || !newPatient.paternalLastName || (!newPatient.phone?.replace(/\D/g, '') && !newPatient.email)))) {
      setAppointmentError('Completá el paciente, la fecha y hora de inicio, y una duración válida.')
      return
    }

    setAppointmentError('')
    setIsSavingAppointment(true)
    try {
      const result = await createAppointmentAction(appointmentForm.patientMode === 'existing' ? { clinicId, patientId: appointmentForm.patientId, startsAt: start, endsAt: new Date(start.getTime() + duration * 60_000), notes: appointmentForm.notes || undefined, status: appointmentForm.status } : { clinicId, patient: newPatient, createNewAnyway, startsAt: start, endsAt: new Date(start.getTime() + duration * 60_000), notes: appointmentForm.notes || undefined, status: appointmentForm.status })
      if ('matches' in result) { setPossibleMatches(result.matches); return }
      await load()
      resetAppointmentForm()
      setIsAppointmentDialogOpen(false)
    } catch (cause) {
      setAppointmentError(cause instanceof Error ? cause.message : 'No se pudo crear la cita.')
    } finally {
      setIsSavingAppointment(false)
    }
  }

  function createAppointment(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); void saveAppointment() }

  async function transition(id: string, status: 'checked_in' | 'in_progress' | 'completed' | 'cancelled') {
    try { await transitionAppointmentAction({ id, status }); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la cita.') }
  }

  async function changeOrder(id: string, status: 'received' | 'ready' | 'delivered' | 'cancelled') {
    try { await updateOrderStatusAction(id, status); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la orden.') }
  }

  async function issuePortalInvitation(patientId: string) {
    setPortalError('')
    try {
      const { token } = await issuePatientPortalInvitationAction({ clinicId, patientId })
      setPortalLink(`${window.location.origin}/portal/activate?token=${encodeURIComponent(token)}`)
    } catch (cause) { setPortalError(cause instanceof Error ? cause.message : 'No se pudo emitir la invitación.') }
  }

  async function revokePortalInvitation(patientId: string) {
    setPortalError('')
    try { await revokePatientPortalInvitationAction({ clinicId, patientId }); setPortalLink('') } catch (cause) { setPortalError(cause instanceof Error ? cause.message : 'No se pudo revocar la invitación.') }
  }

  if (isLoading) return <div className="grid gap-4 md:grid-cols-2" aria-label="Cargando operación"><div className="h-48 animate-pulse rounded-lg border bg-muted/40" /><div className="h-48 animate-pulse rounded-lg border bg-muted/40" /></div>
  if (error) return <div className="rounded-lg border border-destructive/30 p-5" role="alert"><p className="font-medium">No se pudo cargar la información operativa.</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}>Reintentar</Button></div>

  const agendaSection = <section className="rounded-lg border"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-semibold">Agenda</h2><p className="text-sm text-muted-foreground">Citas programadas para la fecha seleccionada.</p></div><input aria-label="Fecha de agenda" className="h-9 rounded-md border bg-background px-3 text-sm" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div><div className="divide-y">{agenda.length ? agenda.map((item) => <div className="flex flex-wrap items-center gap-3 p-4 text-sm" key={item.id}><span className="w-20 font-medium">{new Date(item.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span><span className="min-w-40 flex-1">{item.kind === 'study' ? 'Estudio' : 'Cita clínica'}{item.notes ? ` · ${item.notes}` : ''}</span><Badge variant="outline">{appointmentStatus[item.status] ?? item.status}</Badge>{view === 'agenda' && <div className="flex gap-2">{item.status === 'scheduled' && <Button size="sm" variant="outline" onClick={() => void transition(item.id, 'checked_in')}>Registrar llegada</Button>}{item.status === 'checked_in' && <Button size="sm" variant="outline" onClick={() => void transition(item.id, 'in_progress')}>Iniciar</Button>}{item.status === 'in_progress' && <Button size="sm" variant="outline" onClick={() => void transition(item.id, 'completed')}>Completar</Button>}</div>}</div>) : <p className="p-6 text-sm text-muted-foreground">No hay citas para esta fecha.</p>}</div></section>

  const patientsSection = <section className="rounded-lg border"><div className="border-b p-4"><h2 className="font-semibold">Pacientes e historial</h2><p className="text-sm text-muted-foreground">Pacientes registrados en el negocio.</p></div>{portalLink && <div className="space-y-2 border-b p-4 text-sm"><p className="font-medium">Enlace de activación impreso (mostrado una sola vez)</p><code className="block break-all rounded bg-muted p-2">{portalLink}</code></div>}{portalError && <p className="border-b p-4 text-sm text-destructive" role="alert">{portalError}</p>}{patients.length ? <ul className="divide-y">{patients.map((patient) => <li className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium" key={patient.id}><span>{patientName(patient)}</span><span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void issuePortalInvitation(patient.id)}>Emitir acceso impreso</Button><Button size="sm" variant="outline" onClick={() => void revokePortalInvitation(patient.id)}>Revocar</Button></span></li>)}</ul> : <p className="p-6 text-sm text-muted-foreground">Todavía no hay pacientes registrados.</p>}</section>

  const ordersSection = laboratoryEnabled && <section className="rounded-lg border"><div className="border-b p-4"><h2 className="font-semibold">Órdenes pendientes</h2><p className="text-sm text-muted-foreground">Seguimiento de estudios del laboratorio.</p></div><div className="divide-y">{orders.length ? orders.map((order) => <div className="flex flex-wrap items-center gap-3 p-4 text-sm" key={order.id}><Link className="font-mono text-xs font-medium underline" href={`/clinics/${clinicId}/orders/${order.id}`}>{order.folio}</Link><span className="flex-1">{order.patientHistory?.patient ? patientName(order.patientHistory.patient) : 'Paciente sin datos'}</span><Badge variant="outline">{orderStatus[order.status] ?? order.status}</Badge>{view === 'orders' && <div className="flex gap-2">{order.status === 'draft' && <Button size="sm" variant="outline" onClick={() => void changeOrder(order.id, 'received')}>Recibir</Button>}{order.status === 'received' && <Button size="sm" variant="outline" onClick={() => void changeOrder(order.id, 'ready')}>Marcar lista</Button>}{order.status === 'ready' && <Button size="sm" variant="outline" onClick={() => void changeOrder(order.id, 'delivered')}>Entregar</Button>}</div>}</div>) : <p className="p-6 text-sm text-muted-foreground">No hay órdenes registradas para esta clínica.</p>}</div></section>

  if (view === 'agenda') return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Agenda</h2><p className="text-sm text-muted-foreground">Registra y da seguimiento a las citas de la clínica.</p></div><Button onClick={() => setIsAppointmentDialogOpen(true)}>Nueva cita</Button></div><Dialog open={isAppointmentDialogOpen} onOpenChange={handleAppointmentDialogChange}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg" onInteractOutside={(event) => { if (isSavingAppointment) event.preventDefault() }}><DialogHeader><DialogTitle>Nueva cita</DialogTitle><DialogDescription>Seleccioná el paciente y los datos para programar la cita en esta clínica.</DialogDescription></DialogHeader><form className="grid gap-4" noValidate onSubmit={createAppointment}>
        <div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-patient-mode">Paciente</label><select className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-patient-mode" value={appointmentForm.patientMode} onChange={(event) => { setAppointmentForm((current) => ({ ...current, patientMode: event.target.value as 'existing' | 'new' })); setPossibleMatches([]) }} disabled={isSavingAppointment}><option value="existing">Seleccionar existente</option><option value="new">Registrar nuevo</option></select></div>
        {appointmentForm.patientMode === 'existing' ? <div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-patient">Paciente existente</label><select className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-patient" value={appointmentForm.patientId} onChange={(event) => setAppointmentForm((current) => ({ ...current, patientId: event.target.value }))} required disabled={isSavingAppointment}><option value="">Seleccioná un paciente</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)}</option>)}</select></div> : <><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-first-name">Nombre</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-first-name" value={appointmentForm.firstName} onChange={(event) => setAppointmentForm((current) => ({ ...current, firstName: event.target.value }))} required disabled={isSavingAppointment} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-paternal-last-name">Apellido paterno</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-paternal-last-name" value={appointmentForm.paternalLastName} onChange={(event) => setAppointmentForm((current) => ({ ...current, paternalLastName: event.target.value }))} required disabled={isSavingAppointment} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-maternal-last-name">Apellido materno</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-maternal-last-name" value={appointmentForm.maternalLastName} onChange={(event) => setAppointmentForm((current) => ({ ...current, maternalLastName: event.target.value }))} disabled={isSavingAppointment} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-birth-date">Fecha de nacimiento</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-birth-date" type="date" value={appointmentForm.birthDate} onChange={(event) => setAppointmentForm((current) => ({ ...current, birthDate: event.target.value }))} disabled={isSavingAppointment} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-phone">Teléfono</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-phone" type="tel" value={appointmentForm.phone} onChange={(event) => setAppointmentForm((current) => ({ ...current, phone: event.target.value }))} disabled={isSavingAppointment} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-email">Correo</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-email" type="email" value={appointmentForm.email} onChange={(event) => setAppointmentForm((current) => ({ ...current, email: event.target.value }))} disabled={isSavingAppointment} /></div></div>{possibleMatches.length > 0 && <div className="grid gap-2 rounded-md border border-amber-500/40 p-3 text-sm"><p className="font-medium">Posibles pacientes existentes</p><p className="text-muted-foreground">Seleccioná uno para evitar un duplicado o confirmá que querés registrar uno nuevo.</p>{possibleMatches.map((patient) => <Button key={patient.id} type="button" variant="outline" className="justify-start" disabled={isSavingAppointment} onClick={() => { setAppointmentForm((current) => ({ ...current, patientMode: 'existing', patientId: patient.id })); setPossibleMatches([]) }}>{patientName(patient)}{patient.phone ? ` · ${patient.phone}` : patient.email ? ` · ${patient.email}` : ''}</Button>)}<Button type="button" variant="secondary" disabled={isSavingAppointment} onClick={() => void saveAppointment(true)}>Registrar nuevo de todos modos</Button></div>}</>}
        <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-starts-at">Inicio</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-starts-at" type="datetime-local" value={appointmentForm.startsAt} onChange={(event) => setAppointmentForm((current) => ({ ...current, startsAt: event.target.value }))} required disabled={isSavingAppointment} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-duration">Duración (minutos)</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-duration" type="number" min="1" value={appointmentForm.duration} onChange={(event) => setAppointmentForm((current) => ({ ...current, duration: event.target.value }))} required disabled={isSavingAppointment} /></div></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-status">Estado</label><select className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-status" value={appointmentForm.status} onChange={(event) => setAppointmentForm((current) => ({ ...current, status: event.target.value as 'requested' | 'scheduled' }))} disabled={isSavingAppointment}><option value="scheduled">Programada</option><option value="requested">Solicitada</option></select></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-notes">Motivo o notas</label><textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" id="appointment-notes" maxLength={2000} value={appointmentForm.notes} onChange={(event) => setAppointmentForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Motivo de consulta o notas opcionales" disabled={isSavingAppointment} /></div>{appointmentError && <p className="text-sm text-destructive" role="alert">{appointmentError}</p>}<DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isSavingAppointment}>Cancelar</Button></DialogClose><Button type="submit" disabled={isSavingAppointment}>{isSavingAppointment ? 'Guardando…' : 'Guardar cita'}</Button></DialogFooter></form></DialogContent></Dialog>{agendaSection}</div>
  if (view === 'patients') return <div className="space-y-6"><div><h2 className="text-xl font-semibold">Pacientes e historial</h2><p className="text-sm text-muted-foreground">Consulta la actividad clínica disponible.</p></div>{patientsSection}</div>
  if (view === 'orders') return <div className="space-y-6"><div><h2 className="text-xl font-semibold">Órdenes</h2><p className="text-sm text-muted-foreground">Gestiona las órdenes del laboratorio de esta clínica.</p></div>{ordersSection}</div>

  const pendingOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length
  return <div className="space-y-6"><div><h2 className="text-xl font-semibold">Resumen de hoy</h2><p className="text-sm text-muted-foreground">La información se actualiza con la operación de la clínica.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Citas para la fecha</p><p className="mt-2 text-3xl font-semibold">{agenda.length}</p></div><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Pacientes registrados</p><p className="mt-2 text-3xl font-semibold">{patients.length}</p></div>{laboratoryEnabled && <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Órdenes pendientes</p><p className="mt-2 text-3xl font-semibold">{pendingOrders}</p></div>}</div><div className="grid gap-6 xl:grid-cols-2">{agendaSection}{patientsSection}</div>{laboratoryEnabled && ordersSection}</div>
}
