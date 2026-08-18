'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react'
import { createPublicAppointmentAction, createPublicStudyOrderAction, getPublicAvailabilityAction, listPublicBookingClinicsAction } from '#/modules/appointment/server/publicAppointment'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { NativeSelect } from '#/shared/components/ui/native-select'
import { Textarea } from '#/shared/components/ui/textarea'

import AppointmentWizardFrame from './AppointmentWizardFrame'

type Clinic = { publicSlug: string; name: string; addressLine: string | null; phone: string | null }
type Slot = { startsAt: Date; endsAt: Date }
type PatientAppointmentWizardProps = { onBack: () => void; mode: 'general' | 'study' }

export default function PatientAppointmentWizard({ onBack, mode }: PatientAppointmentWizardProps) {
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
  const [studyType, setStudyType] = useState<'radiography' | 'cbct'>('radiography')
  const [details, setDetails] = useState({ radiographyType: '', region: '', anatomicalRegion: '', specificArea: '', clinicalIndication: '', notes: '' })
  const [hasReferrer, setHasReferrer] = useState(false)
  const [doctor, setDoctor] = useState({ firstName: '', paternalLastName: '', maternalLastName: '', email: '', phone: '', professionalLicense: '', specialty: '', clinicName: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [studyStep, setStudyStep] = useState(1)
  const [generalStep, setGeneralStep] = useState(1)
  const successMessage = mode === 'study' ? 'Tu estudio quedó programado. Te esperamos.' : 'Tu cita quedó programada. Te esperamos.'

  useEffect(() => { void listPublicBookingClinicsAction().then((items) => { setClinics(items); setClinicPublicSlug(items[0]?.publicSlug ?? '') }).catch(() => setMessage('No podemos mostrar las clínicas por ahora.')) }, [])
  useEffect(() => { if (!clinicPublicSlug || !date) return; setLoading(true); setStartsAt(''); void getPublicAvailabilityAction({ clinicPublicSlug, date }).then((result) => { setSlots(result.success ? result.slots : []); if (!result.success) setMessage('No hay horarios disponibles por ahora.') }).catch(() => { setSlots([]); setMessage('No podemos consultar horarios por ahora.') }).finally(() => setLoading(false)) }, [clinicPublicSlug, date])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!startsAt) { setMessage('Selecciona un horario disponible.'); return }
    if (!phone.replace(/\D/g, '') && !email) { setMessage('Ingresa al menos un teléfono o correo.'); return }
    setLoading(true); setMessage('')
    const patient = { clinicPublicSlug, startsAt: new Date(startsAt), firstName, paternalLastName: paternalLastName || undefined, maternalLastName: maternalLastName || undefined, phone: phone || undefined, email: email || undefined }
    const result = mode === 'study'
      ? await createPublicStudyOrderAction({ ...patient, type: studyType, details: studyType === 'radiography' ? { radiographyType: details.radiographyType, region: details.region, clinicalIndication: details.clinicalIndication, notes: details.notes || undefined } : { anatomicalRegion: details.anatomicalRegion, specificArea: details.specificArea, clinicalIndication: details.clinicalIndication, notes: details.notes || undefined }, doctor: hasReferrer ? doctor : undefined })
      : await createPublicAppointmentAction(patient)
    setLoading(false)
    if (result.success) { setMessage(successMessage); setSlots((items) => items.filter((slot) => new Date(slot.startsAt).toISOString() !== startsAt)); setStartsAt(''); if (mode === 'study') setStudyStep(6) } else setMessage(result.error === 'SLOT_NOT_AVAILABLE' ? 'Ese horario ya no está disponible. Elige otro, por favor.' : 'No fue posible programar. Intenta más tarde.')
  }

  function nextStudyStep(event: React.MouseEvent<HTMLButtonElement>) {
    if (!event.currentTarget.form?.reportValidity()) return
    if (studyStep === 1 && !startsAt) { setMessage('Selecciona un horario disponible.'); return }
    if (studyStep === 2 && !phone.replace(/\D/g, '') && !email) { setMessage('Ingresa al menos un teléfono o correo.'); return }
    setMessage(''); setStudyStep((step) => step + 1)
  }

  function nextGeneralStep(event: React.MouseEvent<HTMLButtonElement>) {
    if (!event.currentTarget.form?.reportValidity()) return
    if (generalStep === 1 && !startsAt) { setMessage('Selecciona un horario disponible.'); return }
    if (generalStep === 2 && !phone.replace(/\D/g, '') && !email) { setMessage('Ingresa al menos un teléfono o correo.'); return }
    setMessage(''); setGeneralStep((step) => step + 1)
  }

  const currentStep = mode === 'study' ? studyStep : message === successMessage ? 3 : generalStep
  const field = (id: string, label: string, value: string, onChange: (value: string) => void, options: { type?: string; required?: boolean; maxLength?: number } = {}) => <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} className="h-10" type={options.type} value={value} onChange={(event) => onChange(event.target.value)} maxLength={options.maxLength ?? 120} required={options.required} /></div>
  const clinicField = <div className="space-y-2"><Label htmlFor="clinic">Clínica</Label><NativeSelect id="clinic" className="w-full" value={clinicPublicSlug} onChange={(event) => setClinicPublicSlug(event.target.value)} required>{clinics.map((clinic) => <option key={clinic.publicSlug} value={clinic.publicSlug}>{clinic.name}{clinic.addressLine ? ` - ${clinic.addressLine}` : ''}</option>)}</NativeSelect></div>
  const dateField = <div className="space-y-2"><Label htmlFor="appointment-date">Fecha</Label><Input id="appointment-date" className="h-10" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} required /></div>
  const slotsField = <fieldset className="space-y-2"><legend className="text-sm font-medium">Horarios disponibles</legend><div className="flex flex-wrap gap-2">{loading ? <span className="text-sm text-muted-foreground">Consultando...</span> : slots.length ? slots.map((slot) => { const value = new Date(slot.startsAt).toISOString(); return <Button aria-pressed={startsAt === value} className={startsAt === value ? '' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-pink-50'} key={value} variant={startsAt === value ? 'default' : 'outline'} type="button" onClick={() => setStartsAt(value)}>{new Date(slot.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Button> }) : <span className="text-sm text-muted-foreground">No hay horarios disponibles.</span>}</div></fieldset>
  const patientFields = <><div className="grid gap-4 sm:grid-cols-2">{field('patient-first-name', 'Nombre', firstName, setFirstName, { required: true })}{field('patient-paternal-last-name', 'Apellido paterno', paternalLastName, setPaternalLastName)}</div>{field('patient-maternal-last-name', 'Apellido materno', maternalLastName, setMaternalLastName)}<div className="grid gap-4 sm:grid-cols-2">{field('patient-phone', 'Teléfono', phone, setPhone, { maxLength: 40 })}{field('patient-email', 'Correo', email, setEmail, { type: 'email', maxLength: 254 })}</div><p className="text-xs text-muted-foreground">Ingresa al menos un teléfono o correo.</p></>
  const studyTypeFields = <fieldset className="grid grid-cols-1 gap-4 border-0 p-0 sm:grid-cols-2"><legend className="sr-only">Tipo de estudio</legend><Label htmlFor="study-type-radiography" className={`cursor-pointer space-y-3 rounded-xl border-2 p-6 text-center transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${studyType === 'radiography' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}><input id="study-type-radiography" className="sr-only" name="studyType" type="radio" value="radiography" checked={studyType === 'radiography'} onChange={() => setStudyType('radiography')} /><span className="block text-lg font-bold text-zinc-900">Radiografía</span><span className="block text-xs text-zinc-500">Estudios panorámicos, periapicales o cefalométricos.</span></Label><Label htmlFor="study-type-cbct" className={`cursor-pointer space-y-3 rounded-xl border-2 p-6 text-center transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${studyType === 'cbct' ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:bg-zinc-50'}`}><input id="study-type-cbct" className="sr-only" name="studyType" type="radio" value="cbct" checked={studyType === 'cbct'} onChange={() => setStudyType('cbct')} /><span className="block text-lg font-bold text-zinc-900">CBCT</span><span className="block text-xs text-zinc-500">Tomografía computarizada de haz cónico.</span></Label></fieldset>
  const studyDetailsFields = <><fieldset className="space-y-4"><legend className="text-sm font-medium">Detalles del estudio</legend>{studyType === 'radiography' ? <div className="grid gap-4 sm:grid-cols-2">{field('study-radiography-type', 'Tipo de radiografía', details.radiographyType, (value) => setDetails({ ...details, radiographyType: value }), { required: true })}{field('study-region', 'Pieza o región', details.region, (value) => setDetails({ ...details, region: value }), { required: true })}</div> : <div className="grid gap-4 sm:grid-cols-2">{field('study-anatomical-region', 'Región anatómica', details.anatomicalRegion, (value) => setDetails({ ...details, anatomicalRegion: value }), { required: true })}{field('study-specific-area', 'Área específica', details.specificArea, (value) => setDetails({ ...details, specificArea: value }), { required: true })}</div>}{field('study-clinical-indication', 'Indicación clínica', details.clinicalIndication, (value) => setDetails({ ...details, clinicalIndication: value }), { required: true })}<div className="space-y-2"><Label htmlFor="study-notes">Notas</Label><Textarea id="study-notes" className="min-h-20" value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} maxLength={2000} /></div></fieldset><Label htmlFor="has-referrer" className="w-fit gap-3"><input id="has-referrer" type="checkbox" checked={hasReferrer} onChange={(event) => setHasReferrer(event.target.checked)} /> Tengo profesional remitente</Label>{hasReferrer && <fieldset className="grid gap-4 rounded-lg border border-[var(--clinical-gray-line)] p-4 sm:grid-cols-2"><legend className="px-1 text-sm font-medium">Profesional remitente</legend>{field('referrer-first-name', 'Nombre', doctor.firstName, (value) => setDoctor({ ...doctor, firstName: value }), { required: true })}{field('referrer-paternal-last-name', 'Apellido paterno', doctor.paternalLastName, (value) => setDoctor({ ...doctor, paternalLastName: value }), { required: true })}{field('referrer-email', 'Correo', doctor.email, (value) => setDoctor({ ...doctor, email: value }), { type: 'email', required: true, maxLength: 254 })}{field('referrer-phone', 'Teléfono', doctor.phone, (value) => setDoctor({ ...doctor, phone: value }), { maxLength: 20 })}</fieldset>}</>
  const selectedClinic = clinics.find((clinic) => clinic.publicSlug === clinicPublicSlug)
  const studyReview = <div className="space-y-4"><p className="text-sm text-muted-foreground">Revisa los datos de tu estudio antes de confirmar tu solicitud.</p><div className="grid gap-4 sm:grid-cols-2"><section className="space-y-2 rounded-xl border-2 border-zinc-200 p-4"><h2 className="font-semibold text-zinc-900">Clínica y horario</h2><p className="text-sm text-zinc-600">{selectedClinic?.name}</p><p className="text-sm text-zinc-600">{date} · {startsAt && new Date(startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p></section><section className="space-y-2 rounded-xl border-2 border-zinc-200 p-4"><h2 className="font-semibold text-zinc-900">Tus datos</h2><p className="text-sm text-zinc-600">{[firstName, paternalLastName, maternalLastName].filter(Boolean).join(' ')}</p><p className="text-sm text-zinc-600">{phone || email}</p></section><section className="space-y-2 rounded-xl border-2 border-zinc-200 p-4"><h2 className="font-semibold text-zinc-900">Tipo de estudio</h2><p className="text-sm text-zinc-600">{studyType === 'radiography' ? 'Radiografía' : 'CBCT'}</p></section><section className="space-y-2 rounded-xl border-2 border-zinc-200 p-4"><h2 className="font-semibold text-zinc-900">Detalles del estudio</h2><p className="text-sm text-zinc-600">{studyType === 'radiography' ? `${details.radiographyType} · ${details.region}` : `${details.anatomicalRegion} · ${details.specificArea}`}</p><p className="text-sm text-zinc-600">{details.clinicalIndication}</p>{details.notes && <p className="text-sm text-zinc-600">Notas: {details.notes}</p>}</section>{hasReferrer && <section className="space-y-2 rounded-xl border-2 border-zinc-200 p-4 sm:col-span-2"><h2 className="font-semibold text-zinc-900">Profesional remitente</h2><p className="text-sm text-zinc-600">{[doctor.firstName, doctor.paternalLastName, doctor.maternalLastName].filter(Boolean).join(' ')}</p><p className="text-sm text-zinc-600">{doctor.email}{doctor.phone && ` · ${doctor.phone}`}</p></section>}</div></div>
  const actions = (step: number, lastStep: number, previous: () => void, next: (event: React.MouseEvent<HTMLButtonElement>) => void, confirmLabel: string) => <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--clinical-gray-line)] pt-5"><Button variant="outline" disabled={loading || step === 1} type="button" onClick={previous}>Anterior</Button>{step < lastStep ? <Button disabled={loading} type="button" onClick={next}>Siguiente</Button> : <Button disabled={loading} type="submit">{loading ? 'Programando...' : confirmLabel}</Button>}</div>
  const studyContent = <>{studyStep === 1 && <div className="space-y-4">{clinicField}{dateField}{slotsField}</div>}{studyStep === 2 && <div className="space-y-4">{patientFields}</div>}{studyStep === 3 && <div className="space-y-4">{studyTypeFields}</div>}{studyStep === 4 && <div className="space-y-4">{studyDetailsFields}</div>}{studyStep === 5 && studyReview}{studyStep === 6 && <p aria-live="polite" className="text-sm">{successMessage}</p>}{message && studyStep !== 6 && <p aria-live="polite" className="text-sm">{message}</p>}{studyStep < 6 && actions(studyStep, 5, () => { setMessage(''); setStudyStep((step) => step - 1) }, nextStudyStep, 'Confirmar estudio')}</>
  const generalContent = <>{generalStep === 1 && <div className="space-y-4">{clinicField}{dateField}{slotsField}</div>}{generalStep === 2 && <div className="space-y-4">{patientFields}</div>}{generalStep === 3 && <p className="text-sm text-muted-foreground">Revisa los datos de tu cita y confirma tu solicitud.</p>}{message && <p aria-live="polite" className="text-sm">{message}</p>}{actions(generalStep, 3, () => { setMessage(''); setGeneralStep((step) => step - 1) }, nextGeneralStep, 'Confirmar cita')}</>

  return <AppointmentWizardFrame title={mode === 'study' ? 'Agenda tu estudio' : 'Agenda tu cita'} subtitle={mode === 'study' ? 'Selecciona una clínica y horario, completa los datos del estudio y confirma tu solicitud.' : 'Selecciona una clínica, elige un horario disponible y completa tus datos para confirmar.'} steps={mode === 'study' ? ['Disponibilidad', 'Tus datos', 'Tipo de estudio', 'Detalles del estudio', 'Revisión', 'Confirmación'] : ['Disponibilidad', 'Tus datos', 'Confirmación']} currentStep={currentStep} backLabel="Elegir otra opción" onBack={mode === 'study' && studyStep > 1 ? () => { setMessage(''); setStudyStep((step) => step - 1) } : mode === 'general' && generalStep > 1 ? () => { setMessage(''); setGeneralStep((step) => step - 1) } : onBack}><form className="space-y-5" onSubmit={submit}>{mode === 'study' ? studyContent : generalContent}</form></AppointmentWizardFrame>
}
