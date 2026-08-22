'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, ClipboardList, MessageCircle, Phone } from 'lucide-react'

import { getAuthenticatedPatientBookingAction } from '#/modules/appointment/server/publicAppointment'
import { getProfessionalOrderAccessAction } from '#/modules/order/server/generalOrder'
import PatientAppointmentWizard from './PatientAppointmentWizard'
import ProfessionalOrderWizard from './ProfessionalOrderWizard'

type AppointmentType = 'patient' | 'doctor' | null

function ContactGuidance() {
  const contactOptions = [
    { icon: MessageCircle, title: 'WhatsApp', description: 'Escríbenos y nuestro equipo te ayudará a encontrar la atención que necesitas.', href: 'https://wa.me/525512345678', label: 'Escribir por WhatsApp', external: true },
    { icon: Phone, title: 'Llamada', description: 'Habla directamente con nosotros si prefieres resolver tus dudas por teléfono.', href: 'tel:+525512345678', label: 'Llamar ahora' },
    { icon: CalendarDays, title: 'Formulario en línea', description: 'Completa el formulario de esta página para elegir clínica, fecha y horario.', href: '#appointment-form', label: 'Agendar en línea' },
  ]

  return (
    <section aria-labelledby="appointment-guidance-title" className="border-b border-border bg-secondary py-16 text-foreground sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Siempre estamos disponibles</p>
          <h2 id="appointment-guidance-title" className="mt-4 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Elige cómo prefieres contactarnos</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Por WhatsApp, llamada o desde el formulario: siempre hay una forma de comunicarte con Vitae.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {contactOptions.map(({ icon: Icon, title, description, href, label, external }) => (
            <article key={title} className="flex flex-col border border-border bg-card p-6">
              <Icon aria-hidden="true" className="size-6 text-primary" strokeWidth={1.6} />
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 flex-1 leading-7 text-muted-foreground">{description}</p>
              <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="mt-6 font-semibold text-primary">{label}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AppointmentsPage() {
  return <Suspense fallback={null}><AppointmentsPageContent /></Suspense>
}

function AppointmentsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(() => searchParams.get('tipo') === 'doctor' ? 'doctor' : null)
  const [existingPatient, setExistingPatient] = useState<boolean | null>(null)
  const [authenticatedPatient, setAuthenticatedPatient] = useState(false)
  const choosePatient = async () => {
    const account = await getAuthenticatedPatientBookingAction().catch(() => null)
    setAuthenticatedPatient(!!account)
    setAppointmentType('patient')
  }
  const chooseProfessional = async () => {
    const access = await getProfessionalOrderAccessAction().catch(() => ({ authenticated: false, active: false }))
    if (!access.authenticated) {
      router.push('/client/login?redirect=%2Fappointments%3Ftipo%3Ddoctor')
      return
    }
    setAppointmentType('doctor')
  }

  const choice = (
    <section aria-labelledby="appointment-choice-title" className="appointment-wizard-step border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Agenda con Vitae</p>
          <h1 id="appointment-choice-title" className="mt-4 text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">¿Cómo podemos ayudarte?</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">Elige la opción que corresponde a tu atención.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <button type="button" onClick={() => void choosePatient()} className="group rounded-2xl border border-border bg-card p-6 text-left shadow-[0_16px_40px_color-mix(in_srgb,var(--primary)_8%,transparent)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-[0_20px_48px_color-mix(in_srgb,var(--primary)_14%,transparent)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><CalendarDays aria-hidden="true" className="size-6" strokeWidth={1.6} /></span>
            <h2 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Soy paciente</h2>
            <p className="mt-3 max-w-md leading-7 text-muted-foreground">Agenda una cita o un estudio y consulta los horarios disponibles en tu clínica.</p>
          </button>
          <button type="button" onClick={() => void chooseProfessional()} className="group rounded-2xl border border-primary bg-primary p-6 text-left text-primary-foreground shadow-[0_16px_40px_color-mix(in_srgb,var(--primary)_20%,transparent)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_20px_48px_color-mix(in_srgb,var(--primary)_30%,transparent)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground transition-colors group-hover:bg-primary-foreground group-hover:text-primary"><ClipboardList aria-hidden="true" className="size-6" strokeWidth={1.6} /></span>
            <h2 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Soy profesional</h2>
            <p className="mt-3 max-w-md leading-7 text-primary-foreground/80">Solicita estudios para tus pacientes y conserva los datos necesarios en un solo proceso.</p>
          </button>
        </div>
      </div>
    </section>
  )

  const patientChoice = (
    <section aria-labelledby="patient-choice-title" className="appointment-wizard-step border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Agenda con Vitae</p>
          <h1 id="patient-choice-title" className="mt-4 text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">Cuéntanos sobre ti</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">Elige la opción que corresponde a tu atención.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <button type="button" onClick={() => setExistingPatient(true)} className="group rounded-2xl border border-border bg-card p-6 text-left shadow-[0_16px_40px_color-mix(in_srgb,var(--primary)_8%,transparent)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-[0_20px_48px_color-mix(in_srgb,var(--primary)_14%,transparent)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><CalendarDays aria-hidden="true" className="size-6" strokeWidth={1.6} /></span>
            <h2 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Ya soy paciente</h2>
            <p className="mt-3 max-w-md leading-7 text-muted-foreground">Ingresa tus datos de contacto para localizar tu expediente.</p>
          </button>
          <button type="button" onClick={() => setExistingPatient(false)} className="group rounded-2xl border border-primary bg-primary p-6 text-left text-primary-foreground shadow-[0_16px_40px_color-mix(in_srgb,var(--primary)_20%,transparent)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_20px_48px_color-mix(in_srgb,var(--primary)_30%,transparent)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground transition-colors group-hover:bg-primary-foreground group-hover:text-primary"><ClipboardList aria-hidden="true" className="size-6" strokeWidth={1.6} /></span>
            <h2 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Soy paciente nuevo</h2>
            <p className="mt-3 max-w-md leading-7 text-primary-foreground/80">Crea tu solicitud con tus datos y agenda el horario que prefieras.</p>
          </button>
        </div>
      </div>
    </section>
  )

  return <main id="appointment-form" className="appointment-wizard min-h-[calc(100dvh-5rem)] bg-background text-foreground">{appointmentType === 'patient' ? authenticatedPatient ? <PatientAppointmentWizard existing={false} authenticated onBack={() => setAppointmentType(null)} /> : existingPatient === null ? patientChoice : <PatientAppointmentWizard existing={existingPatient} authenticated={false} onBack={() => setExistingPatient(null)} /> : appointmentType === 'doctor' ? <ProfessionalOrderWizard onBack={() => setAppointmentType(null)} /> : choice}<ContactGuidance /></main>
}
