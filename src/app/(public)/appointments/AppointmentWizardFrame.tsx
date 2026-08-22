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
    <div className="appointment-wizard min-h-[calc(100dvh-5rem)] border-b border-border bg-background py-12 text-foreground sm:py-16">
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-8">
        <section aria-labelledby="appointment-wizard-title" className="overflow-hidden border border-border bg-card shadow-[0_18px_48px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
          <header className="border-b border-border px-6 py-6 sm:px-8 sm:py-8">
            <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {backLabel}
            </button>
            <div className="mt-4">
              <h1 id="appointment-wizard-title" className="font-[family-name:var(--font-raleway)] text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </div>
          </header>

          <nav aria-label="Progreso de la solicitud" className="border-b border-border bg-background px-6 py-5 sm:px-8">
            <ol className="hidden items-start md:flex">
              {steps.map((label, index) => {
                const step = index + 1
                const isComplete = currentStep > step
                const isCurrent = currentStep === step
                return (
                  <li key={label} aria-current={isCurrent ? 'step' : undefined} className="flex min-w-0 flex-1 items-start last:flex-none">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${isCurrent ? 'border-primary bg-primary text-primary-foreground' : isComplete ? 'border-primary bg-card text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                        {isComplete ? <Check aria-hidden="true" className="size-4" /> : step}
                      </span>
                      <span className="sr-only">
                        {label}
                        <span className="sr-only">{isCurrent ? ', paso actual' : isComplete ? ', completado' : ''}</span>
                      </span>
                    </div>
                    {index < steps.length - 1 && <span aria-hidden="true" className={`mx-2 mt-3 h-px min-w-2 flex-1 ${isComplete ? 'bg-primary' : 'bg-border'}`} />}
                  </li>
                )
              })}
            </ol>
            <ol className="sr-only md:hidden">
              {steps.map((label, index) => <li key={label} aria-current={currentStep === index + 1 ? 'step' : undefined}>{label}{currentStep > index + 1 ? ', completado' : ''}</li>)}
            </ol>
            <div className="flex items-center justify-between gap-4 md:hidden">
              <p className="text-sm font-medium text-foreground"><span className="font-semibold">Paso {currentStep} de {steps.length}</span>: {steps[currentStep - 1]}</p>
              <span className="shrink-0 text-xs text-muted-foreground">{Math.round((currentStep / steps.length) * 100)}%</span>
            </div>
            <div className="mt-3 h-1 overflow-hidden bg-secondary md:hidden" aria-hidden="true">
              <div className="h-full bg-primary transition-[width] duration-200 ease-out" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
            </div>
          </nav>

          <div key={currentStep} className="appointment-wizard-step p-6 sm:p-8">{children}</div>
        </section>
      </div>
    </div>
  )
}
