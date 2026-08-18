import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, ScanLine, ShieldCheck, Stethoscope, UserRound } from 'lucide-react'

import { Button } from '#/shared/components/ui/button'

const services = [
  {
    icon: Stethoscope,
    title: 'Consulta y diagnóstico',
    description: 'Evaluamos tu salud bucal y te ayudamos a entender cuál es el tratamiento adecuado para ti.',
  },
  {
    icon: UserRound,
    title: 'Odontología integral',
    description: 'Atención dental pensada para acompañarte desde la prevención hasta tratamientos de mayor seguimiento.',
  },
  {
    icon: ScanLine,
    title: 'Estudios dentales',
    description: 'Radiografías, tomografías y estudios auxiliares para obtener un diagnóstico más completo.',
  },
]

const benefits = [
  'Atención personalizada',
  'Seguimiento de tu tratamiento',
  'Expediente clínico organizado',
  'Comunicación sencilla durante tu atención',
]

export default function HomePage() {
  return (
    <main className="bg-white text-zinc-900">
      <section className="relative isolate flex min-h-[100dvh] items-end overflow-hidden bg-zinc-950 pb-12 pt-28 text-white sm:pb-16 lg:pb-20">
        <Image
          src="/Hero.jpg"
          alt=""
          fill
          preload
          sizes="100vw"
          className="z-0 object-cover object-[60%_center] sm:object-[center_42%]"
        />
        <div aria-hidden="true" className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(24,18,22,.88)_0%,rgba(57,20,39,.66)_42%,rgba(81,18,51,.3)_72%,rgba(24,18,22,.2)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 z-[1] bg-pink-900/20 mix-blend-multiply" />

        <div className="relative z-[2] mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="max-w-xl rounded-2xl border border-white/15 bg-zinc-950/45 p-6 shadow-[0_20px_60px_rgba(50,10,30,.22)] backdrop-blur-sm sm:p-8 lg:max-w-2xl lg:p-10">
            <p className="text-sm font-semibold text-pink-200">Atención dental Vitae</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Cuidar tu sonrisa empieza con claridad.
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-zinc-100 sm:text-lg sm:leading-8">
              Diagnóstico, tratamiento y seguimiento para acompañarte en cada etapa de tu atención.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 rounded-full bg-pink-500 px-7 text-white shadow-[0_10px_28px_rgba(236,72,153,.28)] transition-colors hover:bg-pink-400 focus-visible:ring-pink-200">
                <Link href="/appointments">Agendar cita <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <a href="#servicios" className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-7 text-sm font-medium text-white transition-colors hover:border-pink-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">
                Conocer servicios
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-pink-700">Servicios</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Todo comienza con entender qué necesitas</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-600">Cada paciente es diferente. Por eso el diagnóstico, tratamiento y seguimiento forman parte de una misma atención.</p>
          </div>
          <div className="mt-14 grid gap-x-12 gap-y-10 border-t border-pink-100 pt-8 md:grid-cols-2 lg:grid-cols-[1.2fr_.8fr_1fr]">
            {services.map(({ icon: Icon, title, description }) => (
              <article key={title} className="border-b border-pink-100 pb-8">
                <Icon aria-hidden="true" className="size-5 text-pink-600" strokeWidth={1.6} />
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-3 max-w-sm leading-7 text-zinc-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="nosotros" className="scroll-mt-24 bg-pink-50 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:px-8">
          <div className="rounded-2xl bg-pink-600 p-6 text-white shadow-[0_24px_60px_rgba(190,24,93,.2)] sm:p-8">
            <ShieldCheck aria-hidden="true" className="size-7 text-pink-100" strokeWidth={1.5} />
            <p className="mt-16 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Una atención que se siente acompañada.</p>
          </div>
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-pink-700">Somos Vitae</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Una experiencia dental más cercana</h2>
            <p className="mt-6 text-lg leading-8 text-zinc-600">Desde que agendas una cita hasta el seguimiento posterior, mantenemos tu información y tu atención conectadas.</p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium leading-6 text-zinc-700">
                  <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-pink-600" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="estudios" className="scroll-mt-24 bg-zinc-950 py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_.9fr] lg:items-end lg:px-8">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-pink-300">Para profesionales</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Solicita un estudio para tu paciente</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-300">Mantén la información necesaria para la realización de estudios en un mismo proceso.</p>
            <Button size="lg" asChild className="mt-8 h-12 rounded-full bg-pink-500 px-7 text-white transition-colors hover:bg-pink-400 focus-visible:ring-pink-200">
              <Link href="/appointments?tipo=doctor">Solicitar estudio <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
          <ol className="grid gap-5 border-l border-pink-400/50 pl-6 text-lg font-medium tracking-[-0.02em] text-zinc-100">
            {['Registra los datos del paciente', 'Indica el estudio solicitado', 'Recibe los resultados de tu solicitud'].map((item) => <li key={item}>{item}</li>)}
          </ol>
        </div>
      </section>

      <section id="contacto" className="scroll-mt-24 px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl bg-pink-600 px-6 py-14 text-white shadow-[0_24px_60px_rgba(190,24,93,.2)] sm:px-12 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Da el siguiente paso para cuidar tu sonrisa.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-pink-50">Agenda una valoración y conoce cómo podemos ayudarte.</p>
            <Button size="lg" asChild className="mt-9 h-12 rounded-full bg-white px-7 text-pink-700 transition-colors hover:bg-pink-50 focus-visible:ring-white">
              <Link href="/appointments">Agendar cita <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
