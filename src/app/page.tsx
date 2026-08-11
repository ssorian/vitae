// src/app/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react'

import { Button } from '#/shared/components/ui/button'

const services = [
  {
    icon: Stethoscope,
    title: 'Consulta y diagnóstico',
    description:
      'Evaluamos tu salud bucal y te ayudamos a entender cuál es el tratamiento adecuado para ti.',
  },
  {
    icon: Heart,
    title: 'Odontología integral',
    description:
      'Atención dental pensada para acompañarte desde la prevención hasta tratamientos de mayor seguimiento.',
  },
  {
    icon: ScanLine,
    title: 'Estudios dentales',
    description:
      'Radiografías, tomografías y estudios auxiliares para obtener un diagnóstico más completo.',
  },
]

const benefits = [
  'Atención personalizada',
  'Seguimiento de tu tratamiento',
  'Expediente clínico organizado',
  'Comunicación sencilla por WhatsApp',
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <Image src="/image.svg" alt="" width={40} height={40} />

            <span className="text-2xl font-semibold tracking-tight">
              vitae
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <a
              href="#servicios"
              className="transition-colors hover:text-pink-600"
            >
              Servicios
            </a>

            <a
              href="#nosotros"
              className="transition-colors hover:text-pink-600"
            >
              Nosotros
            </a>

            <a
              href="#estudios"
              className="transition-colors hover:text-pink-600"
            >
              Estudios
            </a>

            <a
              href="#contacto"
              className="transition-colors hover:text-pink-600"
            >
              Contacto
            </a>
          </nav>

          <Button
            asChild
            className="rounded-full bg-pink-600 px-5 text-white hover:bg-pink-700"
          >
            <Link href="/appointments">
              Agendar cita
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden pt-20">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.18),transparent_30%),radial-gradient(circle_at_15%_60%,rgba(251,207,232,0.35),transparent_25%)]" />

        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700">
              <Sparkles className="size-4" />
              Tu sonrisa merece atención que se sienta diferente
            </div>

            <h1 className="text-balance text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Cuidamos de ti,
              <span className="block text-pink-600">
                empezando por tu sonrisa.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-zinc-600 sm:text-xl">
              En Vitae combinamos atención dental, diagnóstico y seguimiento
              para ayudarte a cuidar tu salud bucal de una forma clara,
              cercana y personalizada.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-full bg-pink-600 px-7 text-white shadow-lg shadow-pink-600/20 hover:bg-pink-700"
              >
                <Link href="/appointments">
                  Agendar una cita
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-zinc-200 bg-white px-7"
              >
                <a href="#servicios">
                  Conocer servicios
                </a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-500">
              {[
                'Atención personalizada',
                'Seguimiento clínico',
                'Comunicación sencilla',
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                    <Check className="size-3" />
                  </span>

                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Visual hero */}
          <div className="relative">
            <div className="absolute -inset-12 -z-10 rounded-full bg-pink-200/40 blur-3xl" />

            <div className="relative min-h-[560px] overflow-hidden rounded-[2.5rem] bg-pink-100">
              <div className="absolute inset-x-8 bottom-8 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur sm:left-auto sm:w-80">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pink-600 text-white">
                    <CalendarDays className="size-5" />
                  </div>

                  <div>
                    <p className="font-semibold">
                      Tu atención, organizada
                    </p>

                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Desde tu primera cita hasta el seguimiento de tu
                      tratamiento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex h-full min-h-[560px] items-center justify-center p-12">
                <div className="flex size-48 items-center justify-center rounded-full bg-white/60 text-pink-600 shadow-inner">
                  <Heart className="size-20 stroke-[1.2]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="servicios"
        className="bg-zinc-50 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-medium text-pink-600">
              Nuestra atención
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Todo comienza con entender qué necesitas
            </h2>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              Cada paciente es diferente. Por eso buscamos que el diagnóstico,
              tratamiento y seguimiento formen parte de una misma experiencia.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {services.map(
              ({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group rounded-[2rem] border border-zinc-200 bg-white p-8 transition-all hover:-translate-y-1 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-950/5"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 transition-colors group-hover:bg-pink-600 group-hover:text-white">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="mt-7 text-xl font-semibold">
                    {title}
                  </h3>

                  <p className="mt-3 leading-7 text-zinc-600">
                    {description}
                  </p>

                  <div className="mt-7 flex items-center gap-1 text-sm font-medium text-pink-600">
                    Conocer más
                    <ChevronRight className="size-4" />
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="nosotros"
        className="py-24 sm:py-32"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative min-h-[500px] overflow-hidden rounded-[2.5rem] bg-pink-50">
            <div className="absolute left-10 top-10 rounded-2xl bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-medium text-zinc-400">
                Nuestra prioridad
              </p>

              <p className="mt-1 font-semibold">
                Que entiendas tu atención
              </p>
            </div>

            <div className="absolute bottom-10 right-10 flex size-48 items-center justify-center rounded-full bg-pink-600 text-white">
              <Stethoscope className="size-20 stroke-[1.2]" />
            </div>
          </div>

          <div>
            <p className="font-medium text-pink-600">
              Somos Vitae
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Una experiencia dental más cercana
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-600">
              Queremos que cuidar tu salud dental sea sencillo. Desde el
              momento en que agendas una cita hasta el seguimiento posterior,
              buscamos mantener tu información y tu atención conectadas.
            </p>

            <div className="mt-8 space-y-4">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
                    <Check className="size-4" />
                  </div>

                  <span className="font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Patient experience */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-zinc-950 px-6 py-16 text-white sm:px-12 lg:px-16 lg:py-20">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-pink-500">
                <MessageCircle className="size-6" />
              </div>

              <p className="mt-7 font-medium text-pink-300">
                Seguimos cerca de ti
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Tu clínica también puede estar en tu WhatsApp
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
                Consulta información importante de tu atención y mantén una
                comunicación más sencilla con Vitae desde un canal que ya
                utilizas todos los días.
              </p>
            </div>

            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-4">
              <div className="rounded-[1.5rem] bg-white p-5 text-zinc-950">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                    <Heart className="size-5" />
                  </span>

                  <div>
                    <p className="text-sm font-semibold">
                      Vitae
                    </p>

                    <p className="text-xs text-zinc-400">
                      Atención dental
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl rounded-tl-sm bg-zinc-100 p-4 text-sm leading-6">
                  Hola 👋 ¿Cómo podemos ayudarte?
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    'Agendar cita',
                    'Mis citas',
                    'Mis recetas',
                    'Mi tratamiento',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-zinc-200 px-3 py-3 text-center text-xs font-medium"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor clients */}
      <section
        id="estudios"
        className="py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-14 rounded-[2.5rem] bg-pink-50 p-8 sm:p-12 lg:grid-cols-[1fr_.8fr] lg:p-16">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-pink-600 text-white">
                <ScanLine className="size-6" />
              </div>

              <p className="mt-7 font-medium text-pink-600">
                Para profesionales
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                ¿Eres doctor y necesitas solicitar un estudio?
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
                Solicita los estudios de tus pacientes directamente con
                Vitae y mantén la información necesaria para su realización
                en un mismo proceso.
              </p>

              <Button
                size="lg"
                asChild
                className="mt-8 h-12 rounded-full bg-pink-600 px-7 text-white hover:bg-pink-700"
              >
                <Link href="/orders">
                  Solicitar estudio
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-col justify-center gap-3">
              {[
                'Registra los datos del paciente',
                'Indica el estudio solicitado',
                'Recibe los resultados de tu solicitud',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-pink-200 bg-white p-5"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                    <Check className="size-4" />
                  </div>

                  <span className="font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-zinc-100 bg-zinc-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3 lg:px-8">
          <div className="flex gap-4">
            <ShieldCheck className="mt-1 size-6 shrink-0 text-pink-600" />

            <div>
              <p className="font-semibold">
                Atención responsable
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Tu información clínica acompaña tu atención y seguimiento.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <UserRound className="mt-1 size-6 shrink-0 text-pink-600" />

            <div>
              <p className="font-semibold">
                Atención personalizada
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Cada tratamiento parte de las necesidades de cada paciente.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Clock3 className="mt-1 size-6 shrink-0 text-pink-600" />

            <div>
              <p className="font-semibold">
                Seguimiento continuo
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Tu atención no termina cuando sales del consultorio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section
        id="contacto"
        className="px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-pink-600 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <p className="font-medium text-pink-100">
            Estamos para cuidar de ti
          </p>

          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Da el siguiente paso para cuidar tu sonrisa.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-pink-100">
            Agenda una valoración y conoce cómo podemos ayudarte.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-12 rounded-full bg-white px-7 text-pink-700 hover:bg-pink-50"
            >
              <Link href="/appointments">
                Agendar cita
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/30 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
            >
              <MessageCircle className="mr-2 size-4" />
              Contactar por WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <Image src="/image.svg" alt="" width={36} height={36} />

              <span className="text-xl font-semibold">
                vitae
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500">
              Atención dental enfocada en tu salud, tu tranquilidad y el
              seguimiento de tu sonrisa.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Vitae
            </p>

            <div className="mt-4 space-y-3 text-sm text-zinc-500">
              <a href="#servicios" className="block hover:text-pink-600">
                Servicios
              </a>
              <a href="#nosotros" className="block hover:text-pink-600">
                Nosotros
              </a>
              <a href="#contacto" className="block hover:text-pink-600">
                Contacto
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Profesionales
            </p>

            <div className="mt-4 space-y-3 text-sm text-zinc-500">
              <Link href="/orders" className="block hover:text-pink-600">
                Solicitar estudio
              </Link>
              <Link href="/login" className="block hover:text-pink-600">
                Acceso
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Encuéntranos
            </p>

            <div className="mt-4 space-y-3 text-sm text-zinc-500">
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                Agrega aquí la dirección de Vitae
              </p>

              <p className="flex gap-2">
                <Clock3 className="mt-0.5 size-4 shrink-0" />
                Agrega aquí los horarios
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-zinc-400 sm:flex-row sm:justify-between lg:px-8">
            <span>
              © 2026 Vitae. Todos los derechos reservados.
            </span>

            <span>
              Tu salud comienza con una sonrisa.
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}