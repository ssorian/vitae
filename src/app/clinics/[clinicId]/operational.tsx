'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/shared/components/ui/dialog'
import { createAppointmentAction, listAgendaAction, listPatientsAction, transitionAppointmentAction } from '#/modules/appointment/server/appointment'
import { createPatientAction } from '#/modules/patient/server/patient'
import { issuePatientPortalInvitationAction, revokePatientPortalInvitationAction } from '#/modules/patient/server/portal'

type PatientMatch = { id: string; firstName: string; paternalLastName: string | null; maternalLastName: string | null; phone: string | null; email: string | null }
import { listOrdersAction, updateOrderStatusAction } from '#/modules/order/server/generalOrder'

type View = 'overview' | 'agenda' | 'patients' | 'orders'
type Props = { clinicId: string; laboratoryEnabled: boolean; view: View }

const appointmentStatus: Record<string, string> = { scheduled: 'Programada', requested: 'Solicitada', checked_in: 'En clínica', in_progress: 'En atención', completed: 'Completada', cancelled: 'Cancelada' }
const orderStatus: Record<string, string> = { draft: 'Borrador', received: 'Recibida', scheduled: 'Agendada', in_progress: 'En proceso', ready: 'Lista', delivered: 'Entregada', cancelled: 'Cancelada' }
const studyLabels: Record<string, string> = { radiography: 'Radiografía', radiography_2d: 'Radiografía 2D', cbct: 'Tomografía CBCT', cephalometric_analysis: 'Análisis cefalométrico', study_models: 'Modelos de estudio', intraoral_scan: 'Escaneo intraoral', orthodontic_package: 'Paquete ortodóncico', aligner_package: 'Paquete de alineadores', laboratory_order: 'Orden de laboratorio', endodontic_evaluation: 'Evaluación endodóntica' }

function patientName(patient: { firstName: string; paternalLastName?: string | null; maternalLastName?: string | null }) {
  return [patient.firstName, patient.paternalLastName, patient.maternalLastName].filter(Boolean).join(' ')
}

export function ClinicOperations({ clinicId, laboratoryEnabled, view }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [agenda, setAgenda] = useState<Awaited<ReturnType<typeof listAgendaAction>>>([])
  const [patients, setPatients] = useState<Awaited<ReturnType<typeof listPatientsAction>>>([])
  
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof listOrdersAction>>>([])
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState({ patientId: '', startsAt: '', duration: '30', notes: '', status: 'scheduled' as 'requested' | 'scheduled', patientMode: 'existing' as 'existing' | 'new', firstName: '', paternalLastName: '', maternalLastName: '', birthDate: '', phone: '', email: '' })
  const [possibleMatches, setPossibleMatches] = useState<PatientMatch[]>([])
  const [appointmentError, setAppointmentError] = useState('')
  const [isSavingAppointment, setIsSavingAppointment] = useState(false)
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false)
  const [patientForm, setPatientForm] = useState({ firstName: '', paternalLastName: '', maternalLastName: '', phone: '', email: '' })
  const [patientMatches, setPatientMatches] = useState<PatientMatch[]>([])
  const [patientError, setPatientError] = useState('')
  const [isSavingPatient, setIsSavingPatient] = useState(false)
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

  function resetPatientForm() {
    setPatientForm({ firstName: '', paternalLastName: '', maternalLastName: '', phone: '', email: '' })
    setPatientMatches([])
    setPatientError('')
  }

  function handlePatientDialogChange(open: boolean) {
    if (isSavingPatient) return
    setIsPatientDialogOpen(open)
    if (!open) resetPatientForm()
  }

  async function savePatient(createNewAnyway = false) {
    if (!patientForm.firstName || !patientForm.paternalLastName || (!patientForm.phone.replace(/\D/g, '') && !patientForm.email)) {
      setPatientError('Completá el nombre, el apellido paterno y un teléfono o correo.')
      return
    }

    setPatientError('')
    setIsSavingPatient(true)
    try {
      const result = await createPatientAction({ clinicId, patient: { firstName: patientForm.firstName, paternalLastName: patientForm.paternalLastName, maternalLastName: patientForm.maternalLastName || undefined, phone: patientForm.phone || undefined, email: patientForm.email || undefined }, createNewAnyway })
      if ('matches' in result) { setPatientMatches(result.matches); return }
      await load()
      resetPatientForm()
      setIsPatientDialogOpen(false)
    } catch (cause) {
      setPatientError(cause instanceof Error ? cause.message : 'No se pudo registrar el paciente.')
    } finally {
      setIsSavingPatient(false)
    }
  }

  function createPatient(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); void savePatient() }

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

  async function changeOrder(id: string, status: 'received') {
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

  if (isLoading && view === 'orders') return <section className="overflow-hidden rounded-xl border" aria-label="Cargando órdenes"><div className="space-y-2 border-b p-4"><div className="h-5 w-24 animate-pulse rounded bg-muted" /><div className="h-9 animate-pulse rounded bg-muted" /></div><div className="space-y-px p-3">{Array.from({ length: 5 }, (_, index) => <div className="h-16 animate-pulse rounded bg-muted/60" key={index} />)}</div></section>
  if (isLoading) return <div className="grid gap-4 md:grid-cols-2" aria-label="Cargando operación"><div className="h-48 animate-pulse rounded-lg border bg-muted/40" /><div className="h-48 animate-pulse rounded-lg border bg-muted/40" /></div>
  if (error) return <div className="rounded-lg border border-destructive/30 p-5" role="alert"><p className="font-medium">No se pudo cargar la información operativa.</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}>Reintentar</Button></div>

  const agendaSection = <section className="rounded-lg border"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-semibold">Agenda</h2><p className="text-sm text-muted-foreground">Citas programadas para la fecha seleccionada.</p></div><input aria-label="Fecha de agenda" className="h-9 rounded-md border bg-background px-3 text-sm" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div><div className="divide-y">{agenda.length ? agenda.map((item) => <div className="flex flex-wrap items-center gap-3 p-4 text-sm" key={item.id}><span className="w-20 font-medium">{new Date(item.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span><span className="min-w-40 flex-1">{item.kind === 'study' ? 'Estudio' : 'Cita clínica'}{item.notes ? ` · ${item.notes}` : ''}</span><Badge variant="outline">{appointmentStatus[item.status] ?? item.status}</Badge>{view === 'agenda' && <div className="flex gap-2">{item.status === 'scheduled' && <Button size="sm" variant="outline" onClick={() => void transition(item.id, 'checked_in')}>Registrar llegada</Button>}{item.status === 'checked_in' && <Button size="sm" variant="outline" onClick={() => void transition(item.id, 'in_progress')}>Iniciar</Button>}{item.status === 'in_progress' && <Button size="sm" variant="outline" onClick={() => void transition(item.id, 'completed')}>Completar</Button>}</div>}</div>) : <p className="p-6 text-sm text-muted-foreground">No hay citas para esta fecha.</p>}</div></section>

  const patientsSection = <section className="rounded-lg border"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-semibold">Pacientes e historial</h2><p className="text-sm text-muted-foreground">Pacientes registrados en el negocio.</p></div>{view === 'patients' && <Button onClick={() => setIsPatientDialogOpen(true)}>Nuevo paciente</Button>}</div>{portalLink && <div className="space-y-2 border-b p-4 text-sm"><p className="font-medium">Enlace de activación impreso (mostrado una sola vez)</p><code className="block break-all rounded bg-muted p-2">{portalLink}</code></div>}{portalError && <p className="border-b p-4 text-sm text-destructive" role="alert">{portalError}</p>}{patients.length ? <ul className="divide-y">{patients.map((patient) => <li className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium" key={patient.id}><span>{patientName(patient)}</span><span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void issuePortalInvitation(patient.id)}>Emitir acceso impreso</Button><Button size="sm" variant="outline" onClick={() => void revokePortalInvitation(patient.id)}>Revocar</Button></span></li>)}</ul> : <p className="p-6 text-sm text-muted-foreground">Todavía no hay pacientes registrados.</p>}</section>

  const normalizedOrderSearch = orderSearch.trim().toLocaleLowerCase('es-MX')
  const visibleOrders = orders.filter((order) => { const doctor = order.doctorClient ? patientName(order.doctorClient) : 'Autorreferido'; return (orderStatusFilter === 'all' || order.status === orderStatusFilter) && (!normalizedOrderSearch || [order.folio, order.patientHistory?.patient ? patientName(order.patientHistory.patient) : '', doctor].join(' ').toLocaleLowerCase('es-MX').includes(normalizedOrderSearch)) })
  const orderCounts = orders.reduce<Record<string, number>>((counts, order) => ({ ...counts, [order.status]: (counts[order.status] ?? 0) + 1 }), {})
  const ordersSection = laboratoryEnabled && <section className="overflow-hidden rounded-xl border bg-card"><div className="space-y-4 border-b p-4"><div><h2 className="font-semibold">Órdenes</h2><p className="text-sm text-muted-foreground">Seguimiento de estudios del laboratorio.</p></div><div className="flex flex-col gap-2 sm:flex-row"><input aria-label="Buscar por folio, paciente o doctor" className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" placeholder="Buscar folio, paciente o doctor" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} /><select aria-label="Filtrar por estado" className="h-9 rounded-md border bg-background px-3 text-sm" value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}><option value="all">Todos ({orders.length})</option>{Object.entries(orderStatus).map(([status, label]) => <option key={status} value={status}>{label} ({orderCounts[status] ?? 0})</option>)}</select></div></div>{orders.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No hay órdenes registradas para esta clínica.</div> : visibleOrders.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No hay órdenes que coincidan con la búsqueda o el estado.</div> : <><div className="hidden divide-y md:block"><div className="grid grid-cols-[1fr_1.4fr_1.4fr_1fr_auto] gap-3 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground"><span>Folio y estudio</span><span>Paciente</span><span>Solicitante</span><span>Registro</span><span>Estado</span></div>{visibleOrders.map((order) => <Link className="grid grid-cols-[1fr_1.4fr_1.4fr_1fr_auto] gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted" key={order.id} href={`/clinics/${clinicId}/orders/${order.id}`}><span><span className="block font-mono text-xs font-semibold text-primary">{order.folio}</span><span className="block truncate text-muted-foreground">{studyLabels[order.type] ?? order.type}</span></span><span className="truncate font-medium">{order.patientHistory?.patient ? patientName(order.patientHistory.patient) : 'Paciente sin datos'}</span><span className="truncate">{order.doctorClient ? patientName(order.doctorClient) : 'Autorreferido'}</span><span className="text-muted-foreground">{new Date(order.createdAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span><Badge variant="outline">{orderStatus[order.status] ?? order.status}</Badge></Link>)}</div><div className="grid gap-3 p-3 md:hidden">{visibleOrders.map((order) => <article key={order.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-primary">{order.folio}</p><p className="mt-1 font-medium">{order.patientHistory?.patient ? patientName(order.patientHistory.patient) : 'Paciente sin datos'}</p></div><Badge variant="outline">{orderStatus[order.status] ?? order.status}</Badge></div><dl className="mt-3 grid gap-2 text-sm"><div><dt className="text-xs text-muted-foreground">Estudio</dt><dd>{studyLabels[order.type] ?? order.type}</dd></div><div><dt className="text-xs text-muted-foreground">Solicitante</dt><dd>{order.doctorClient ? patientName(order.doctorClient) : 'Autorreferido'}</dd></div><div><dt className="text-xs text-muted-foreground">Registrada</dt><dd>{new Date(order.createdAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div></dl><Link className="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4" href={`/clinics/${clinicId}/orders/${order.id}`}>Ver detalle</Link>{view === 'orders' && order.status === 'draft' && <Button className="mt-3" size="sm" variant="outline" onClick={() => void changeOrder(order.id, 'received')}>Recibir orden</Button>}</article>)}</div></>}</section>

  if (view === 'agenda') return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Agenda</h2><p className="text-sm text-muted-foreground">Registra y da seguimiento a las citas de la clínica.</p></div><Button onClick={() => setIsAppointmentDialogOpen(true)}>Nueva cita</Button></div><Dialog open={isAppointmentDialogOpen} onOpenChange={handleAppointmentDialogChange}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg" onInteractOutside={(event) => { if (isSavingAppointment) event.preventDefault() }}><DialogHeader><DialogTitle>Nueva cita</DialogTitle><DialogDescription>Seleccioná el paciente y los datos para programar la cita en esta clínica.</DialogDescription></DialogHeader><form className="grid gap-4" noValidate onSubmit={createAppointment}>
        <div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-patient-mode">Paciente</label><select className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-patient-mode" value={appointmentForm.patientMode} onChange={(event) => { setAppointmentForm((current) => ({ ...current, patientMode: event.target.value as 'existing' | 'new' })); setPossibleMatches([]) }} disabled={isSavingAppointment}><option value="existing">Seleccionar existente</option><option value="new">Registrar nuevo</option></select></div>
        {appointmentForm.patientMode === 'existing' ? <div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-patient">Paciente existente</label><select className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-patient" value={appointmentForm.patientId} onChange={(event) => setAppointmentForm((current) => ({ ...current, patientId: event.target.value }))} required disabled={isSavingAppointment}><option value="">Seleccioná un paciente</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)}</option>)}</select></div> : <><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-first-name">Nombre</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-first-name" value={appointmentForm.firstName} onChange={(event) => setAppointmentForm((current) => ({ ...current, firstName: event.target.value }))} required disabled={isSavingAppointment} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-paternal-last-name">Apellido paterno</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-paternal-last-name" value={appointmentForm.paternalLastName} onChange={(event) => setAppointmentForm((current) => ({ ...current, paternalLastName: event.target.value }))} required disabled={isSavingAppointment} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-maternal-last-name">Apellido materno</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-maternal-last-name" value={appointmentForm.maternalLastName} onChange={(event) => setAppointmentForm((current) => ({ ...current, maternalLastName: event.target.value }))} disabled={isSavingAppointment} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-birth-date">Fecha de nacimiento</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-birth-date" type="date" value={appointmentForm.birthDate} onChange={(event) => setAppointmentForm((current) => ({ ...current, birthDate: event.target.value }))} disabled={isSavingAppointment} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-phone">Teléfono</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-phone" type="tel" value={appointmentForm.phone} onChange={(event) => setAppointmentForm((current) => ({ ...current, phone: event.target.value }))} disabled={isSavingAppointment} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="patient-email">Correo</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="patient-email" type="email" value={appointmentForm.email} onChange={(event) => setAppointmentForm((current) => ({ ...current, email: event.target.value }))} disabled={isSavingAppointment} /></div></div>{possibleMatches.length > 0 && <div className="grid gap-2 rounded-md border border-amber-500/40 p-3 text-sm"><p className="font-medium">Posibles pacientes existentes</p><p className="text-muted-foreground">Seleccioná uno para evitar un duplicado o confirmá que querés registrar uno nuevo.</p>{possibleMatches.map((patient) => <Button key={patient.id} type="button" variant="outline" className="justify-start" disabled={isSavingAppointment} onClick={() => { setAppointmentForm((current) => ({ ...current, patientMode: 'existing', patientId: patient.id })); setPossibleMatches([]) }}>{patientName(patient)}{patient.phone ? ` · ${patient.phone}` : patient.email ? ` · ${patient.email}` : ''}</Button>)}<Button type="button" variant="secondary" disabled={isSavingAppointment} onClick={() => void saveAppointment(true)}>Registrar nuevo de todos modos</Button></div>}</>}
        <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-starts-at">Inicio</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-starts-at" type="datetime-local" value={appointmentForm.startsAt} onChange={(event) => setAppointmentForm((current) => ({ ...current, startsAt: event.target.value }))} required disabled={isSavingAppointment} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-duration">Duración (minutos)</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-duration" type="number" min="1" value={appointmentForm.duration} onChange={(event) => setAppointmentForm((current) => ({ ...current, duration: event.target.value }))} required disabled={isSavingAppointment} /></div></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-status">Estado</label><select className="h-9 rounded-md border bg-background px-3 text-sm" id="appointment-status" value={appointmentForm.status} onChange={(event) => setAppointmentForm((current) => ({ ...current, status: event.target.value as 'requested' | 'scheduled' }))} disabled={isSavingAppointment}><option value="scheduled">Programada</option><option value="requested">Solicitada</option></select></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="appointment-notes">Motivo o notas</label><textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" id="appointment-notes" maxLength={2000} value={appointmentForm.notes} onChange={(event) => setAppointmentForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Motivo de consulta o notas opcionales" disabled={isSavingAppointment} /></div>{appointmentError && <p className="text-sm text-destructive" role="alert">{appointmentError}</p>}<DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isSavingAppointment}>Cancelar</Button></DialogClose><Button type="submit" disabled={isSavingAppointment}>{isSavingAppointment ? 'Guardando…' : 'Guardar cita'}</Button></DialogFooter></form></DialogContent></Dialog>{agendaSection}</div>
  const patientDialog = <Dialog open={isPatientDialogOpen} onOpenChange={handlePatientDialogChange}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg" onInteractOutside={(event) => { if (isSavingPatient) event.preventDefault() }}><DialogHeader><DialogTitle>Nuevo paciente</DialogTitle><DialogDescription>Registrá un paciente para toda la organización, sin crear una cita.</DialogDescription></DialogHeader><form className="grid gap-4" noValidate onSubmit={createPatient}><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="new-patient-first-name">Nombre</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="new-patient-first-name" value={patientForm.firstName} onChange={(event) => setPatientForm((current) => ({ ...current, firstName: event.target.value }))} required disabled={isSavingPatient} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="new-patient-paternal-last-name">Apellido paterno</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="new-patient-paternal-last-name" value={patientForm.paternalLastName} onChange={(event) => setPatientForm((current) => ({ ...current, paternalLastName: event.target.value }))} required disabled={isSavingPatient} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="new-patient-maternal-last-name">Apellido materno</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="new-patient-maternal-last-name" value={patientForm.maternalLastName} onChange={(event) => setPatientForm((current) => ({ ...current, maternalLastName: event.target.value }))} disabled={isSavingPatient} /></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="new-patient-phone">Teléfono</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="new-patient-phone" type="tel" value={patientForm.phone} onChange={(event) => setPatientForm((current) => ({ ...current, phone: event.target.value }))} disabled={isSavingPatient} /></div></div><div className="grid gap-2"><label className="text-sm font-medium" htmlFor="new-patient-email">Correo</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id="new-patient-email" type="email" value={patientForm.email} onChange={(event) => setPatientForm((current) => ({ ...current, email: event.target.value }))} disabled={isSavingPatient} /></div>{patientMatches.length > 0 && <div className="grid gap-2 rounded-md border border-amber-500/40 p-3 text-sm"><p className="font-medium">Posibles pacientes existentes</p><p className="text-muted-foreground">Seleccioná uno para no registrar un duplicado, o confirmá que querés registrarlo de todos modos.</p>{patientMatches.map((patient) => <Button key={patient.id} type="button" variant="outline" className="justify-start" disabled={isSavingPatient} onClick={() => handlePatientDialogChange(false)}>{patientName(patient)}{patient.phone ? ` · ${patient.phone}` : patient.email ? ` · ${patient.email}` : ''}</Button>)}<Button type="button" variant="secondary" disabled={isSavingPatient} onClick={() => void savePatient(true)}>Registrar nuevo de todos modos</Button></div>}{patientError && <p className="text-sm text-destructive" role="alert">{patientError}</p>}<DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isSavingPatient}>Cancelar</Button></DialogClose><Button type="submit" disabled={isSavingPatient}>{isSavingPatient ? 'Guardando…' : 'Registrar paciente'}</Button></DialogFooter></form></DialogContent></Dialog>

  if (view === 'patients') return <div className="space-y-6"><div><h2 className="text-xl font-semibold">Pacientes e historial</h2><p className="text-sm text-muted-foreground">Consulta la actividad clínica disponible.</p></div>{patientsSection}{patientDialog}</div>
  if (view === 'orders') return <div className="space-y-6"><div><h2 className="text-xl font-semibold">Órdenes</h2><p className="text-sm text-muted-foreground">Gestiona las órdenes del laboratorio de esta clínica.</p></div>{ordersSection}</div>

  const pendingOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length
  return <div className="space-y-6"><div><h2 className="text-xl font-semibold">Resumen de hoy</h2><p className="text-sm text-muted-foreground">La información se actualiza con la operación de la clínica.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Citas para la fecha</p><p className="mt-2 text-3xl font-semibold">{agenda.length}</p></div><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Pacientes registrados</p><p className="mt-2 text-3xl font-semibold">{patients.length}</p></div>{laboratoryEnabled && <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Órdenes pendientes</p><p className="mt-2 text-3xl font-semibold">{pendingOrders}</p></div>}</div><div className="grid gap-6 xl:grid-cols-2">{agendaSection}{patientsSection}</div>{laboratoryEnabled && ordersSection}</div>
}
