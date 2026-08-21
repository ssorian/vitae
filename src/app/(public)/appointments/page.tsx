'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, ClipboardList } from 'lucide-react'

import PatientAppointmentWizard from './PatientAppointmentWizard'
import ProfessionalOrderWizard from './ProfessionalOrderWizard'

type AppointmentType = 'patient' | 'doctor' | null

function ContactGuidance() {
  return (
    <section aria-labelledby="appointment-guidance-title" className="border-b border-pink-100 bg-white py-16 text-zinc-900 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-pink-700">Antes de continuar</p>
          <h2 id="appointment-guidance-title" className="mt-4 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Elige el camino que necesitas</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600">Selecciona la opción de paciente para agendar una cita o estudio. Si eres profesional, podrás solicitar estudios para tus pacientes.</p>
        </div>
      </div>
    </section>
  )
}

export default function AppointmentsPage() {
  return <Suspense fallback={null}><AppointmentsPageContent /></Suspense>
}

function AppointmentsPageContent() {
  const searchParams = useSearchParams()
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(() => searchParams.get('tipo') === 'doctor' ? 'doctor' : null)

  const choice = (
    <section aria-labelledby="appointment-choice-title" className="appointment-wizard-step border-b border-pink-100 bg-pink-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-pink-700">Agenda con Vitae</p>
          <h1 id="appointment-choice-title" className="mt-4 text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">¿Cómo podemos ayudarte?</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">Elige la opción que corresponde a tu atención.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <button type="button" onClick={() => setAppointmentType('patient')} className="group rounded-2xl border border-pink-200 bg-white p-6 text-left shadow-[0_16px_40px_rgba(190,24,93,.08)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-pink-400 hover:shadow-[0_20px_48px_rgba(190,24,93,.14)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-4 sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-pink-100 text-pink-700 transition-colors group-hover:bg-pink-600 group-hover:text-white"><CalendarDays aria-hidden="true" className="size-6" strokeWidth={1.6} /></span>
            <h2 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Soy paciente</h2>
            <p className="mt-3 max-w-md leading-7 text-zinc-600">Agenda una cita o un estudio y consulta los horarios disponibles en tu clínica.</p>
          </button>
          <button type="button" onClick={() => setAppointmentType('doctor')} className="group rounded-2xl border border-pink-200 bg-pink-600 p-6 text-left text-white shadow-[0_16px_40px_rgba(190,24,93,.2)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(190,24,93,.3)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-4 sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/15 text-white transition-colors group-hover:bg-white group-hover:text-pink-700"><ClipboardList aria-hidden="true" className="size-6" strokeWidth={1.6} /></span>
            <h2 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">Soy profesional</h2>
            <p className="mt-3 max-w-md leading-7 text-pink-50">Solicita estudios para tus pacientes y conserva los datos necesarios en un solo proceso.</p>
          </button>
        </div>
      </div>
    </section>
  )


  return <main className="appointment-wizard min-h-[calc(100dvh-4rem)] bg-white text-zinc-900">{appointmentType === 'patient' ? <PatientAppointmentWizard onBack={() => setAppointmentType(null)} /> : appointmentType === 'doctor' ? <ProfessionalOrderWizard onBack={() => setAppointmentType(null)} /> : choice}<ContactGuidance /></main>
}
