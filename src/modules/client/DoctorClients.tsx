'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'

import { createDoctorClientAction, listDoctorClientsAction } from '#/modules/client/server/doctors'
import { Button } from '#/shared/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/shared/components/ui/dialog'

const emptyForm = { firstName: '', paternalLastName: '', maternalLastName: '', email: '', phone: '', professionalLicense: '', specialty: '', clinicName: '' }
type Doctor = Awaited<ReturnType<typeof listDoctorClientsAction>>[number]
type ExistingDoctor = { id: string; name: string; email: string }

export function DoctorClients({ clinicId }: { clinicId: string }) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [existing, setExisting] = useState<ExistingDoctor | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setDoctors(await listDoctorClientsAction(clinicId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los doctores clientes.')
    } finally {
      setIsLoading(false)
    }
  }, [clinicId])

  useEffect(() => { void load() }, [load])

  function reset() { setForm(emptyForm); setExisting(null); setError('') }
  function changeOpen(open: boolean) { if (isSaving) return; setIsOpen(open); if (!open) reset() }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setExisting(null)
    setIsSaving(true)
    try {
      const result = await createDoctorClientAction({ clinicId, doctor: form })
      if (result.state === 'existing') { setExisting(result.match); return }
      await load()
      reset()
      setIsOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar el doctor cliente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="h-48 animate-pulse rounded-lg border bg-muted/40" aria-label="Cargando doctores clientes" />
  if (error && !isOpen) return <div className="rounded-lg border border-destructive/30 p-5" role="alert"><p className="font-medium">No se pudieron cargar los doctores clientes.</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}>Reintentar</Button></div>

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Doctores clientes</h2><p className="text-sm text-muted-foreground">Profesionales externos registrados como clientes de la organización.</p></div><Button onClick={() => setIsOpen(true)}>Nuevo doctor cliente</Button></div>
    <section className="rounded-lg border"><div className="border-b p-4"><h3 className="font-semibold">Profesionales registrados</h3></div>{doctors.length ? <ul className="divide-y">{doctors.map((doctor) => <li className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm" key={doctor.id}><div><p className="font-medium">{doctor.name}</p><p className="text-muted-foreground">{doctor.email}</p>{[doctor.phone, doctor.professionalLicense && `Cédula: ${doctor.professionalLicense}`, doctor.specialty].filter(Boolean).length > 0 && <p className="mt-1 text-muted-foreground">{[doctor.phone, doctor.professionalLicense && `Cédula: ${doctor.professionalLicense}`, doctor.specialty].filter(Boolean).join(' · ')}</p>}</div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border px-2 py-1 text-xs">{doctor.status === 'active' ? 'Activo' : 'Inactivo'}</span>{doctor.accessState === 'linked' ? <span className="rounded-full border px-2 py-1 text-xs">Cuenta vinculada</span> : <Link className="rounded-full border px-2 py-1 text-xs underline" href="/login?redirect=/appointments?tipo=doctor">Sin cuenta</Link>}</div></li>)}</ul> : <p className="p-6 text-sm text-muted-foreground">Todavía no hay doctores clientes registrados.</p>}</section>
    <Dialog open={isOpen} onOpenChange={changeOpen}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg" onInteractOutside={(event) => { if (isSaving) event.preventDefault() }}><DialogHeader><DialogTitle>Nuevo doctor cliente</DialogTitle><DialogDescription>Registrá un profesional externo como cliente; no crea una cuenta ni una membresía.</DialogDescription></DialogHeader><form className="grid gap-4" noValidate onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><Field id="doctor-first-name" label="Nombre" required value={form.firstName} disabled={isSaving} onChange={(firstName) => setForm((current) => ({ ...current, firstName }))} /><Field id="doctor-paternal-last-name" label="Apellido paterno" required value={form.paternalLastName} disabled={isSaving} onChange={(paternalLastName) => setForm((current) => ({ ...current, paternalLastName }))} /></div><div className="grid gap-4 sm:grid-cols-2"><Field id="doctor-maternal-last-name" label="Apellido materno" value={form.maternalLastName} disabled={isSaving} onChange={(maternalLastName) => setForm((current) => ({ ...current, maternalLastName }))} /><Field id="doctor-email" label="Correo" type="email" required value={form.email} disabled={isSaving} onChange={(email) => setForm((current) => ({ ...current, email }))} /></div><div className="grid gap-4 sm:grid-cols-2"><Field id="doctor-phone" label="Teléfono" type="tel" value={form.phone} disabled={isSaving} onChange={(phone) => setForm((current) => ({ ...current, phone }))} /><Field id="doctor-license" label="Cédula profesional" value={form.professionalLicense} disabled={isSaving} onChange={(professionalLicense) => setForm((current) => ({ ...current, professionalLicense }))} /></div><div className="grid gap-4 sm:grid-cols-2"><Field id="doctor-specialty" label="Especialidad" value={form.specialty} disabled={isSaving} onChange={(specialty) => setForm((current) => ({ ...current, specialty }))} /><Field id="doctor-clinic-name" label="Consultorio" value={form.clinicName} disabled={isSaving} onChange={(clinicName) => setForm((current) => ({ ...current, clinicName }))} /></div>{existing && <div className="rounded-md border border-amber-500/40 p-3 text-sm"><p className="font-medium">Este doctor cliente ya existe</p><p className="text-muted-foreground">{existing.name} · {existing.email}. No se creó un duplicado.</p></div>}{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : 'Registrar doctor cliente'}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>
}

function Field({ id, label, type = 'text', required = false, value, disabled, onChange }: { id: string; label: string; type?: string; required?: boolean; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return <div className="grid gap-2"><label className="text-sm font-medium" htmlFor={id}>{label}</label><input className="h-9 rounded-md border bg-background px-3 text-sm" id={id} type={type} value={value} required={required} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></div>
}
