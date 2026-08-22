'use client'

import Image from 'next/image'

import { publicStudyTypes } from '#/modules/order/schemas/studyCatalog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '#/shared/components/ui/carousel'

type Study = (typeof publicStudyTypes)[number]

const studyLabels: Record<Study, string> = {
  radiography: 'Radiografía',
  radiography_2d: 'Radiografía 2D',
  cbct: 'CBCT',
  cephalometric_analysis: 'Análisis cefalométrico',
  study_models: 'Modelos de estudio',
  intraoral_scan: 'Escaneo intraoral',
  orthodontic_package: 'Paquete ortodóncico',
  aligner_package: 'Paquete de alineadores',
  laboratory_order: 'Orden de laboratorio',
}

const slides = [
  {
    title: 'Diagnóstico con claridad',
    description: 'Estudios de imagen que ayudan a entender cada caso con mayor claridad.',
    image: '/studies/dental-radiography.jpg',
    alt: 'Radiografía dental',
    studies: publicStudyTypes.slice(0, 5) as Study[],
  },
  {
    title: 'Planeación conectada',
    description: 'Estudios digitales y paquetes de trabajo para acompañar cada etapa del tratamiento.',
    image: '/studies/dental-xray-film.jpg',
    alt: 'Radiografía dental en una placa',
    studies: publicStudyTypes.slice(5) as Study[],
  },
]

export function StudyTypesCarousel() {
  return (
    <Carousel opts={{ loop: true }} className="mx-auto mt-12 max-w-5xl px-1 sm:px-14">
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.title}>
            <article className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_38px_color-mix(in_srgb,var(--primary)_10%,transparent)] md:grid-cols-[.78fr_1.22fr]">
              <div className="relative min-h-52 md:min-h-full">
                <Image src={slide.image} alt={slide.alt} fill sizes="(min-width: 768px) 32vw, 100vw" className="object-cover opacity-80" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" />
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="font-[family-name:var(--font-raleway)] text-2xl font-semibold tracking-[-0.035em] text-foreground">{slide.title}</h3>
                <p className="mt-3 max-w-xl leading-7 text-muted-foreground">{slide.description}</p>
                <ul className="mt-6 grid gap-x-6 gap-y-3 border-t border-border pt-5 sm:grid-cols-2">
                  {slide.studies.map((study) => (
                    <li key={study} className="text-sm font-medium text-foreground">{studyLabels[study]}</li>
                  ))}
                </ul>
              </div>
            </article>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-5 flex justify-end gap-3">
        <CarouselPrevious className="static size-10 translate-x-0 translate-y-0 border-border bg-card text-foreground hover:border-primary hover:bg-card disabled:opacity-35" />
        <CarouselNext className="static size-10 translate-x-0 translate-y-0 border-border bg-card text-foreground hover:border-primary hover:bg-card disabled:opacity-35" />
      </div>
    </Carousel>
  )
}
