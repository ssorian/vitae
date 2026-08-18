'use client'

import { useState } from 'react'

import { updateClinicSettingsAction } from '#/modules/clinic/server/clinic'
import { publicBookingSettingsSchema } from '#/modules/clinic/schemas/clinic'
import type { ClinicPublicHours } from '#/modules/clinic/db/schema'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function ClinicSettings({ clinicId, enabled, publicHours: initialPublicHours, slotIntervalMinutes: initialSlotIntervalMinutes, canManage }: { clinicId: string; enabled: boolean; publicHours: ClinicPublicHours; slotIntervalMinutes: number; canManage: boolean }) {
  const [laboratoryEnabled, setLaboratoryEnabled] = useState(enabled)
  const [publicHours, setPublicHours] = useState(initialPublicHours)
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(initialSlotIntervalMinutes)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function save() {
    const result = publicBookingSettingsSchema.safeParse({ publicHours, slotIntervalMinutes })
    if (!result.success) return setError(result.error.issues[0]?.message ?? 'La configuración no es válida.')
    setPending(true); setError('')
    try { await updateClinicSettingsAction(clinicId, { ...result.data, laboratoryEnabled }) } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración.') } finally { setPending(false) }
  }

  return <div className="rounded-lg border p-4"><h2 className="font-medium">Configuración</h2><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={laboratoryEnabled} onChange={(event) => setLaboratoryEnabled(event.target.checked)} disabled={!canManage || pending} />Laboratorio habilitado</label><p className="mt-2 text-sm text-muted-foreground">No puede deshabilitarse si hay órdenes que no estén entregadas ni canceladas.</p><div className="mt-5 grid gap-3"><div className="grid gap-2"><Label htmlFor="slotIntervalMinutes">Intervalo de citas públicas (minutos)</Label><Input id="slotIntervalMinutes" type="number" min="5" max="30" value={slotIntervalMinutes} onChange={(event) => setSlotIntervalMinutes(Number(event.target.value))} disabled={!canManage || pending} required /><p className="text-sm text-muted-foreground">Use 5, 10, 15 o 30 minutos. Las citas públicas duran 30 minutos.</p></div><fieldset className="grid gap-3"><legend className="text-sm font-medium">Horario de citas públicas</legend><p className="text-sm text-muted-foreground">Si no activa ningún día, no habrá disponibilidad para citas públicas.</p>{weekdays.map((day, dayOfWeek) => { const hour = publicHours.find((value) => value.dayOfWeek === dayOfWeek); return <div key={day} className="grid items-center gap-2 sm:grid-cols-[8rem_1fr_1fr]"><Label className="flex items-center gap-2"><input type="checkbox" checked={!!hour} onChange={(event) => setPublicHours(event.target.checked ? [...publicHours.filter((value) => value.dayOfWeek !== dayOfWeek), { dayOfWeek, startTime: '09:00', endTime: '17:00' }] : publicHours.filter((value) => value.dayOfWeek !== dayOfWeek))} disabled={!canManage || pending} />{day}</Label><Input aria-label={`Apertura ${day}`} type="time" disabled={!hour || !canManage || pending} required={!!hour} value={hour?.startTime ?? ''} onChange={(event) => setPublicHours(publicHours.map((value) => value.dayOfWeek === dayOfWeek ? { ...value, startTime: event.target.value } : value))} /><Input aria-label={`Cierre ${day}`} type="time" disabled={!hour || !canManage || pending} required={!!hour} value={hour?.endTime ?? ''} onChange={(event) => setPublicHours(publicHours.map((value) => value.dayOfWeek === dayOfWeek ? { ...value, endTime: event.target.value } : value))} /></div> })}</fieldset></div>{error && <p className="mt-2 text-sm text-destructive">{error}</p>}<Button className="mt-3" disabled={!canManage || pending} onClick={save}>{pending ? 'Guardando...' : 'Guardar'}</Button></div>
}
