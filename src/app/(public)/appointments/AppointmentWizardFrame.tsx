'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, Check } from 'lucide-react'

type AppointmentWizardFrameProps = {
  title: string
  subtitle: string
  steps: string[]
  currentStep: number
  backLabel: string
  onBack: () => void
  children: ReactNode
}

export default function AppointmentWizardFrame({
  title,
  subtitle,
  steps,
  currentStep,
  backLabel,
  onBack,
  children,
}: AppointmentWizardFrameProps) {
  return (
    <div className="appointment-wizard min-h-[calc(100dvh-4rem)] border-b border-pink-100 bg-pink-50 py-16 text-zinc-900 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <section aria-labelledby="appointment-wizard-title" className="overflow-hidden rounded-2xl border border-pink-200 bg-white shadow-[0_20px_50px_rgba(190,24,93,.1)]">
          <header className="border-b border-pink-100 px-6 py-6 sm:px-8 sm:py-8">
            <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-pink-50 hover:text-pink-700 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-4">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {backLabel}
            </button>
            <div className="mt-4">
              <h1 id="appointment-wizard-title" className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{subtitle}</p>
            </div>
          </header>

          <nav aria-label="Progreso de la solicitud" className="border-b border-pink-100 bg-pink-50 px-6 py-5 sm:px-8">
            <ol className="hidden items-start md:flex">
              {steps.map((label, index) => {
                const step = index + 1
                const isComplete = currentStep > step
                const isCurrent = currentStep === step
                return (
                  <li key={label} aria-current={isCurrent ? 'step' : undefined} className="flex min-w-0 flex-1 items-start last:flex-none">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${isCurrent ? 'border-pink-700 bg-pink-700 text-white' : isComplete ? 'border-pink-700 bg-white text-pink-700' : 'border-pink-200 bg-white text-zinc-500'}`}>
                        {isComplete ? <Check aria-hidden="true" className="size-4" /> : step}
                      </span>
                      <span className="sr-only">
                        {label}
                        <span className="sr-only">{isCurrent ? ', paso actual' : isComplete ? ', completado' : ''}</span>
                      </span>
                    </div>
                    {index < steps.length - 1 && <span aria-hidden="true" className={`mx-2 mt-3 h-px min-w-2 flex-1 ${isComplete ? 'bg-pink-700' : 'bg-pink-200'}`} />}
                  </li>
                )
              })}
            </ol>
            <ol className="sr-only md:hidden">
              {steps.map((label, index) => <li key={label} aria-current={currentStep === index + 1 ? 'step' : undefined}>{label}{currentStep > index + 1 ? ', completado' : ''}</li>)}
            </ol>
            <div className="flex items-center justify-between gap-4 md:hidden">
              <p className="text-sm font-medium text-zinc-900"><span className="font-semibold">Paso {currentStep} de {steps.length}</span>: {steps[currentStep - 1]}</p>
              <span className="shrink-0 text-xs text-zinc-600">{Math.round((currentStep / steps.length) * 100)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-pink-100 md:hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-pink-700 transition-[width] duration-200 ease-out" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
            </div>
          </nav>

          <div key={currentStep} className="appointment-wizard-step p-6 sm:p-8">{children}</div>
        </section>
      </div>
    </div>
  )
}
