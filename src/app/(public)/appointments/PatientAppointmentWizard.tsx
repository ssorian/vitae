'use client'

import { useEffect, useState } from 'react'
import { Box, CalendarDays, ClipboardList, FileText, Ruler, ScanLine } from 'lucide-react'

import { createAuthenticatedPublicAppointmentAction, createAuthenticatedPublicStudyOrderAction, createExistingPublicAppointmentAction, createExistingPublicStudyOrderAction, createPublicAppointmentAction, createPublicStudyOrderAction, getPublicAvailabilityAction, listPublicBookingClinicsAction } from '#/modules/appointment/server/publicAppointment'
import { defaultStudyDetails, StudyDetailsForm } from '#/modules/order/StudyDetailsForm'
import { publicStudyTypes, studyDetailsSchemaByType } from '#/modules/order/schemas/studyCatalog'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { NativeSelect } from '#/shared/components/ui/native-select'
import AppointmentWizardFrame from './AppointmentWizardFrame'

type Clinic = { publicSlug: string; name: string }
type StudyType = (typeof publicStudyTypes)[number]
type Service = 'general' | StudyType

const labels: Record<StudyType, string> = { radiography: 'Radiografía', radiography_2d: 'Radiografía 2D', cbct: 'CBCT', cephalometric_analysis: 'Análisis cefalométrico', study_models: 'Modelos de estudio', intraoral_scan: 'Escaneo intraoral', orthodontic_package: 'Paquete ortodóncico', aligner_package: 'Paquete de alineadores', laboratory_order: 'Orden de laboratorio' }
const icons: Record<Service, typeof CalendarDays> = { general: CalendarDays, radiography: ScanLine, radiography_2d: ScanLine, cbct: ScanLine, cephalometric_analysis: Ruler, study_models: Box, intraoral_scan: ScanLine, orthodontic_package: ClipboardList, aligner_package: ClipboardList, laboratory_order: FileText }

export default function PatientAppointmentWizard({ existing, authenticated, onBack }: { existing: boolean; authenticated: boolean; onBack: () => void }) {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [clinicPublicSlug, setClinicPublicSlug] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<{ startsAt: Date }[]>([])
  const [startsAt, setStartsAt] = useState('')
  const [service, setService] = useState<Service | null>(null)
  const [firstName, setFirstName] = useState('')
  const [paternalLastName, setPaternalLastName] = useState('')
  const [maternalLastName, setMaternalLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [referring, setReferring] = useState(false)
  const [doctor, setDoctor] = useState({ firstName: '', paternalLastName: '', email: '' })
  const [details, setDetails] = useState(defaultStudyDetails('radiography'))
  const [step, setStep] = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const studyType = service === 'general' || !service ? 'radiography' : service
  const isStudy = service !== 'general' && service !== null
  const steps = authenticated ? ['Servicio', 'Detalles', 'Horario', 'Revisión', 'Confirmación'] : ['Identificación', 'Servicio', 'Detalles', 'Horario', 'Revisión', 'Confirmación']
  const serviceStep = authenticated ? 1 : 2
  const detailsStep = serviceStep + 1
  const scheduleStep = detailsStep + 1
  const reviewStep = scheduleStep + 1

  useEffect(() => {
    void listPublicBookingClinicsAction().then((items) => {
      setClinics(items)
      setClinicPublicSlug(items[0]?.publicSlug ?? '')
    })
  }, [])
  useEffect(() => {
    if (!clinicPublicSlug) return
    void getPublicAvailabilityAction({ clinicPublicSlug, date }).then((result) => setSlots(result.success ? result.slots : []))
  }, [clinicPublicSlug, date])

  const chooseService = (nextService: Service) => {
    setService(nextService)
    if (nextService !== 'general') setDetails(defaultStudyDetails(nextService))
    setStep(detailsStep)
  }
  const valid = () => {
    if (!authenticated && step === 1) {
      if (!existing && (!firstName.trim() || !paternalLastName.trim() || !maternalLastName.trim())) return 'Ingresa tu nombre y apellidos.'
      if (!phone.trim() && !email.trim()) return 'Ingresa teléfono o correo.'
      if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return 'Ingresa un correo válido.'
    }
    if (isStudy && step === detailsStep) {
      if (!studyDetailsSchemaByType[studyType].safeParse(details).success) return 'Completa los detalles requeridos.'
      if (referring && (!doctor.firstName.trim() || !doctor.paternalLastName.trim() || !/^\S+@\S+\.\S+$/.test(doctor.email.trim()))) return 'Completa los datos del profesional remitente.'
    }
    if (step === scheduleStep && !startsAt) return 'Selecciona un horario.'
    return ''
  }
  const next = () => {
    const error = valid()
    setMessage(error)
    if (!error) setStep((current) => current + 1)
  }
  const submit = async () => {
    const error = valid()
    if (error) return setMessage(error)
    setLoading(true)
    const base = { clinicPublicSlug, startsAt: new Date(startsAt) }
    const patient = { ...base, firstName, paternalLastName, maternalLastName, phone: phone || undefined, email: email || undefined }
    const study = { ...patient, type: studyType, details, doctor: referring ? doctor : undefined }
    const result = isStudy ? authenticated ? await createAuthenticatedPublicStudyOrderAction({ ...base, type: studyType, details }) : existing ? await createExistingPublicStudyOrderAction(study) : await createPublicStudyOrderAction(study) : authenticated ? await createAuthenticatedPublicAppointmentAction(base) : existing ? await createExistingPublicAppointmentAction({ ...base, phone: phone || undefined, email: email || undefined }) : await createPublicAppointmentAction(patient)
    setLoading(false)
    if (result.success) {
      setMessage('Solicitud programada.')
      setStep(reviewStep + 1)
    } else setMessage('No fue posible programar la solicitud.')
  }
  const back = () => {
    if (step === detailsStep) {
      setService(null)
      setStep(serviceStep)
      return
    }
    setStep((current) => current - 1)
  }

  const identification = <div className="grid gap-3 sm:grid-cols-2">{!existing && <><label>Nombre<Input required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label>Apellido paterno<Input required value={paternalLastName} onChange={(event) => setPaternalLastName(event.target.value)} /></label><label>Apellido materno<Input required value={maternalLastName} onChange={(event) => setMaternalLastName(event.target.value)} /></label></>}<label>Teléfono<Input value={phone} onChange={(event) => setPhone(event.target.value)} /></label><label>Correo<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label></div>
  const referrer = isStudy && <div className="space-y-2"><label className="flex gap-2"><input type="checkbox" checked={referring} onChange={(event) => setReferring(event.target.checked)} />Me remite un profesional</label>{referring && <div className="grid gap-3 sm:grid-cols-3"><label>Nombre<Input value={doctor.firstName} onChange={(event) => setDoctor({ ...doctor, firstName: event.target.value })} /></label><label>Apellido paterno<Input value={doctor.paternalLastName} onChange={(event) => setDoctor({ ...doctor, paternalLastName: event.target.value })} /></label><label>Correo<Input type="email" value={doctor.email} onChange={(event) => setDoctor({ ...doctor, email: event.target.value })} /></label></div>}</div>

  if (!authenticated && step === 1) return <AppointmentWizardFrame title="Identifícate" subtitle={existing ? 'Ingresa un teléfono o correo para asociar tu solicitud.' : 'Ingresa tus datos para crear tu solicitud.'} steps={steps} currentStep={step} backLabel="Volver" onBack={onBack}><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); next() }}>{identification}{message && <p className="text-sm text-red-600">{message}</p>}<div className="flex justify-end border-t pt-4"><Button>Siguiente</Button></div></form></AppointmentWizardFrame>
  if (!service) return <AppointmentWizardFrame title="Elige tu servicio" subtitle="Selecciona la atención que necesitas agendar." steps={steps} currentStep={serviceStep} backLabel="Volver" onBack={onBack}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(['general', ...publicStudyTypes] as Service[]).map((type) => {
    const Icon = icons[type]
    const label = type === 'general' ? 'Cita general' : labels[type]
    const description = type === 'general' ? 'Agenda una consulta o atención clínica.' : 'Solicita este estudio en tu clínica.'
    return <button key={type} type="button" onClick={() => chooseService(type)} className="group min-h-48 rounded-2xl border border-pink-200 bg-white p-5 text-left shadow-[0_8px_24px_rgba(190,24,93,.06)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-pink-400 hover:shadow-[0_12px_28px_rgba(190,24,93,.12)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-4"><span className="flex size-11 items-center justify-center rounded-full bg-pink-100 text-pink-700 transition-colors group-hover:bg-pink-600 group-hover:text-white"><Icon aria-hidden="true" className="size-5" strokeWidth={1.6} /></span><strong className="mt-6 block text-lg">{label}</strong><span className="mt-2 block text-sm leading-6 text-zinc-600">{description}</span></button>
  })}</div></AppointmentWizardFrame>

  return <AppointmentWizardFrame title={isStudy ? `Agenda tu ${labels[studyType]}` : 'Agenda tu cita'} subtitle="Completa los pasos para confirmar tu solicitud." steps={steps} currentStep={Math.min(step, steps.length)} backLabel="Elegir otro servicio" onBack={back}><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submit() }}>{step > reviewStep ? <p>{message}</p> : <>{step === detailsStep && (isStudy ? <div className="space-y-4"><StudyDetailsForm type={studyType} value={details} onChange={setDetails} />{referrer}</div> : <div className="space-y-2 text-sm"><h2 className="text-lg font-semibold">Detalles de tu cita</h2><p className="text-zinc-600">La atención se definirá contigo durante la consulta. Continúa para elegir el horario que más te convenga.</p></div>)}{step === scheduleStep && <div className="space-y-3"><NativeSelect value={clinicPublicSlug} onChange={(event) => setClinicPublicSlug(event.target.value)}>{clinics.map((clinic) => <option key={clinic.publicSlug} value={clinic.publicSlug}>{clinic.name}</option>)}</NativeSelect><Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /><div className="flex flex-wrap gap-2">{slots.map((slot) => { const value = new Date(slot.startsAt).toISOString(); return <Button key={value} type="button" variant={startsAt === value ? 'default' : 'outline'} onClick={() => setStartsAt(value)}>{new Date(slot.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Button> })}</div></div>}{step === reviewStep && <div className="space-y-2 text-sm"><p><strong>Clínica:</strong> {clinics.find((clinic) => clinic.publicSlug === clinicPublicSlug)?.name}</p><p><strong>Horario:</strong> {startsAt && new Date(startsAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</p>{isStudy && <p><strong>Estudio:</strong> {labels[studyType]}</p>}</div>}{message && <p className="text-sm text-red-600">{message}</p>}<div className="flex justify-end border-t pt-4">{step < reviewStep ? <Button type="button" onClick={next}>Siguiente</Button> : <Button disabled={loading}>{loading ? 'Programando...' : 'Confirmar'}</Button>}</div></>}</form></AppointmentWizardFrame>
}
