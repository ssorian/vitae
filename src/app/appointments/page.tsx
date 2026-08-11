'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react'
import { createPublicAppointmentAction, getPublicAvailabilityAction, listPublicBookingClinicsAction } from '#/modules/appointment/server/publicAppointment'

type Clinic = { publicSlug: string; name: string; addressLine: string | null; phone: string | null }
type Slot = { startsAt: Date; endsAt: Date }

export default function PublicAppointmentsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [clinicPublicSlug, setClinicPublicSlug] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<Slot[]>([])
  const [startsAt, setStartsAt] = useState('')
  const [firstName, setFirstName] = useState('')
  const [paternalLastName, setPaternalLastName] = useState('')
  const [maternalLastName, setMaternalLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { void listPublicBookingClinicsAction().then((items) => { setClinics(items); setClinicPublicSlug(items[0]?.publicSlug ?? '') }).catch(() => setMessage('No podemos mostrar las clínicas por ahora.')) }, [])
  useEffect(() => { if (!clinicPublicSlug || !date) return; setLoading(true); setStartsAt(''); void getPublicAvailabilityAction({ clinicPublicSlug, date }).then((result) => { setSlots(result.success ? result.slots : []); if (!result.success) setMessage('No hay horarios disponibles por ahora.') }).catch(() => { setSlots([]); setMessage('No podemos consultar horarios por ahora.') }).finally(() => setLoading(false)) }, [clinicPublicSlug, date])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!startsAt) { setMessage('Selecciona un horario disponible.'); return }
    setLoading(true); setMessage('')
    const result = await createPublicAppointmentAction({ clinicPublicSlug, startsAt: new Date(startsAt), firstName, paternalLastName: paternalLastName || undefined, maternalLastName: maternalLastName || undefined, phone: phone || undefined, email: email || undefined })
    setLoading(false)
    if (result.success) { setMessage('Tu cita quedó programada. Te esperamos.'); setSlots((items) => items.filter((slot) => new Date(slot.startsAt).toISOString() !== startsAt)); setStartsAt('') } else setMessage(result.error === 'SLOT_NOT_AVAILABLE' ? 'Ese horario ya no está disponible. Elige otro, por favor.' : 'No fue posible programar la cita. Intenta más tarde.')
  }

  return <main className="mx-auto max-w-xl space-y-6 p-6"><header><h1 className="text-2xl font-semibold">Agenda tu cita</h1><p className="text-sm text-muted-foreground">Selecciona una clínica y horario disponible.</p></header><form className="space-y-5" onSubmit={submit}><label className="block text-sm">Clínica<select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={clinicPublicSlug} onChange={(event) => setClinicPublicSlug(event.target.value)} required>{clinics.map((clinic) => <option key={clinic.publicSlug} value={clinic.publicSlug}>{clinic.name}{clinic.addressLine ? ` — ${clinic.addressLine}` : ''}</option>)}</select></label><label className="block text-sm">Fecha<input className="mt-1 h-10 w-full rounded-md border bg-background px-3" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} required /></label><fieldset><legend className="text-sm">Horarios disponibles</legend><div className="mt-2 flex flex-wrap gap-2">{loading ? <span className="text-sm text-muted-foreground">Consultando…</span> : slots.length ? slots.map((slot) => { const value = new Date(slot.startsAt).toISOString(); return <button className={`rounded-md border px-3 py-2 text-sm ${startsAt === value ? 'border-primary bg-primary text-primary-foreground' : ''}`} key={value} type="button" onClick={() => setStartsAt(value)}>{new Date(slot.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</button> }) : <span className="text-sm text-muted-foreground">No hay horarios disponibles.</span>}</div></fieldset><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Nombre<input className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={120} required /></label><label className="text-sm">Apellido paterno<input className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={paternalLastName} onChange={(event) => setPaternalLastName(event.target.value)} maxLength={120} /></label></div><label className="block text-sm">Apellido materno<input className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={maternalLastName} onChange={(event) => setMaternalLastName(event.target.value)} maxLength={120} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Teléfono<input className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} /></label><label className="text-sm">Correo<input className="mt-1 h-10 w-full rounded-md border bg-background px-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} /></label></div><p className="text-xs text-muted-foreground">Ingresa al menos un teléfono o correo.</p>{message && <p aria-live="polite" className="text-sm">{message}</p>}<button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={loading} type="submit">{loading ? 'Programando…' : 'Confirmar cita'}</button></form></main>
}
