'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'

import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { getOrderDetailsAction, updateOrderStatusAction, deliverOrderResultsAction } from '#/modules/order/server/generalOrder'
import { scheduleOrderAppointmentAction } from '#/modules/appointment/server/appointment'

type OrderDetails = NonNullable<Awaited<ReturnType<typeof getOrderDetailsAction>>>
type Props = { orderId: string; ordersPath: string; viewerPath: string }

const STATUS_LABELS: Record<string, string> = { draft: 'Borrador', received: 'Recibida', scheduled: 'Agendada', in_progress: 'En proceso', ready: 'Lista', delivered: 'Entregada', cancelled: 'Cancelada' }
const STUDY_LABELS = { radiography: 'Radiografía', cbct: 'CBCT' } as const
const SEX_LABELS: Record<string, string> = { male: 'Masculino', female: 'Femenino', other: 'Otro', unspecified: 'No especificado' }
const EVENT_LABELS: Record<string, string> = { 'order.created': 'Orden creada', 'order.scheduled': 'Estudio agendado', 'order.started': 'Estudio iniciado', 'result.uploaded': 'Archivo de resultado adjuntado', 'result.finalized': 'Resultado finalizado', 'email.sent': 'Resultados enviados por correo', 'order.delivered': 'Resultados entregados', 'order.cancelled': 'Orden cancelada' }

export function OrderDetail({ orderId, ordersPath, viewerPath }: Props) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [slot, setSlot] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [accessCode, setAccessCode] = useState<string | null>(null)

  const loadOrder = useCallback(async () => {
    try {
      const data = await getOrderDetailsAction(orderId)
      setOrder(data ?? null)
    } finally { setLoading(false) }
  }, [orderId])

  useEffect(() => { void loadOrder() }, [loadOrder])

  async function scheduleStudy() {
    if (!order || !slot) return
    setSubmitting(true)
    try { const startsAt = new Date(slot); await scheduleOrderAppointmentAction({ orderId: order.id, startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60000) }); await loadOrder() } catch { setError('No se pudo agendar el estudio.') } finally { setSubmitting(false) }
  }

  async function cancel() {
    if (!order) return
    setSubmitting(true)
    try { await updateOrderStatusAction(order.id, 'cancelled'); await loadOrder() } catch { setError('No se pudo actualizar la orden.') } finally { setSubmitting(false) }
  }

  async function uploadResult(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!order) return
    setSubmitting(true); setError('')
    try {
      const response = await fetch(`/api/org/orders/${order.id}/result`, { method: 'POST', body: new FormData(event.currentTarget) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      event.currentTarget.reset()
      await loadOrder()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron adjuntar los resultados.') } finally { setSubmitting(false) }
  }

  async function deliver() {
    if (!order) return
    setSubmitting(true); setError('')
    try { const delivered = await deliverOrderResultsAction(order.id); setAccessCode(delivered.accessCode); await loadOrder() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron enviar los resultados.') } finally { setSubmitting(false) }
  }

  if (loading) return <div className="py-20 text-center text-zinc-400">Cargando orden...</div>
  if (!order) return <div className="py-20 text-center"><p>Orden no encontrada.</p><Button variant="ghost" onClick={() => router.push(ordersPath)}>Volver a órdenes</Button></div>

  const patient = order.patientHistory?.patient
  const doctor = order.doctorClient
  const details = order.details as { radiographyType?: string; region?: string; anatomicalRegion?: string; specificArea?: string; clinicalIndication?: string; notes?: string }
  const result = order.results?.[0]
  const hasViewerAssets = order.assets?.some((asset) => asset.type === 'dicom' || asset.type === 'image')
  const canAttachResult = !result && !['delivered', 'cancelled'].includes(order.status)

  return <div className="mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
    <header className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => router.push(ordersPath)}><ArrowLeft className="mr-1 h-4 w-4" />Órdenes</Button><div><p className="font-mono font-bold text-primary">{order.folio}</p><Badge>{STATUS_LABELS[order.status] ?? order.status}</Badge></div></div><div className="flex flex-wrap gap-2">{order.status === 'received' && <><input className="rounded border p-2 text-xs" type="datetime-local" value={slot} onChange={(event) => setSlot(event.target.value)} /><Button size="sm" disabled={submitting || !slot} onClick={scheduleStudy}>Agendar estudio</Button></>}{['received', 'scheduled', 'in_progress'].includes(order.status) && <Button variant="destructive" size="sm" disabled={submitting} onClick={cancel}>Cancelar</Button>}{order.status === 'ready' && <Button size="sm" disabled={submitting} onClick={deliver}><Send className="mr-2 h-4 w-4" />{submitting ? 'Enviando...' : 'Enviar resultados'}</Button>}</div></header>
    {error && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {accessCode && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Código de acceso (muéstralo o imprímelo ahora; no volverá a mostrarse): <strong className="font-mono">{order.folio} / {accessCode}</strong></p>}
    <div className="grid gap-4 lg:grid-cols-3"><div className="space-y-4 lg:col-span-2">
      <Card><CardHeader><CardTitle>Estudio y especificaciones</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p><span className="font-medium">Estudio:</span> {STUDY_LABELS[order.type]}</p><p><span className="font-medium">Clínica:</span> {order.clinic?.name ?? '—'}</p>{order.type === 'radiography' ? <><p><span className="font-medium">Tipo de radiografía:</span> {details.radiographyType ?? '—'}</p><p><span className="font-medium">Pieza o región:</span> {details.region ?? '—'}</p></> : <><p><span className="font-medium">Región anatómica:</span> {details.anatomicalRegion ?? '—'}</p><p><span className="font-medium">Área específica:</span> {details.specificArea ?? '—'}</p></>}<p><span className="font-medium">Indicación clínica:</span> {details.clinicalIndication ?? '—'}</p>{details.notes && <p><span className="font-medium">Notas:</span> {details.notes}</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Doctor solicitante</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">{doctor ? <><p>{[doctor.firstName, doctor.paternalLastName, doctor.maternalLastName].filter(Boolean).join(' ')}</p><p>{doctor.email}</p>{doctor.specialty && <p><span className="font-medium">Especialidad:</span> {doctor.specialty}</p>}{doctor.professionalLicense && <p><span className="font-medium">Cédula profesional:</span> {doctor.professionalLicense}</p>}{doctor.clinicName && <p><span className="font-medium">Clínica:</span> {doctor.clinicName}</p>}{doctor.phone && <p><span className="font-medium">Teléfono:</span> {doctor.phone}</p>}</> : <p>—</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Paciente</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">{patient ? <><p>{[patient.firstName, patient.paternalLastName, patient.maternalLastName].filter(Boolean).join(' ')}</p>{patient.birthDate && <p><span className="font-medium">Fecha de nacimiento:</span> {new Date(patient.birthDate).toLocaleDateString('es-MX')}</p>}{patient.sex && <p><span className="font-medium">Sexo:</span> {SEX_LABELS[patient.sex] ?? patient.sex}</p>}{patient.phone && <p><span className="font-medium">Teléfono:</span> {patient.phone}</p>}{patient.email && <p>{patient.email}</p>}</> : <p>—</p>}</CardContent></Card>
      {canAttachResult && <Card><CardHeader><CardTitle>Finalizar y adjuntar resultados</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={uploadResult}><textarea required name="observations" className="min-h-24 w-full rounded border p-2 text-sm" placeholder="Observaciones" /><label className="block text-sm">Fecha realizada<input required name="realizedAt" type="date" className="ml-2 rounded border p-2" /></label><label className="block text-sm">Archivos JPG o DICOM (máximo 10; 500 MB por archivo; 500 MB total)<input required name="files" type="file" accept="image/jpeg,.jpg,.jpeg,.dcm,.dicom,application/dicom" multiple className="mt-1 block" /></label><Button disabled={submitting}>{submitting ? 'Guardando...' : 'Finalizar resultado'}</Button></form></CardContent></Card>}
      {result && <Card><CardHeader><CardTitle>Resultado finalizado</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm">{result.observations || 'Sin observaciones.'}</p><p className="mt-2 text-xs text-zinc-500">Realizado: {result.realizedAt ? new Date(result.realizedAt).toLocaleDateString('es-MX') : '—'}</p>{hasViewerAssets && <Button className="mt-3" size="sm" onClick={() => router.push(viewerPath)}>Abrir visor</Button>}</CardContent></Card>}
      {!!order.assets?.length && <Card><CardHeader><CardTitle>Archivos adjuntos</CardTitle></CardHeader><CardContent><ul className="space-y-2">{order.assets.map((asset) => <li key={asset.id} className="rounded border p-2 text-sm">{asset.name} <Badge variant="outline">{asset.type}</Badge></li>)}</ul></CardContent></Card>}
    </div><Card><CardHeader><CardTitle>Actividad</CardTitle></CardHeader><CardContent><ol className="space-y-3">{[...(order.events ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((event) => <li key={event.id} className="text-sm"><p>{EVENT_LABELS[event.type] ?? event.type}</p><p className="text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString('es-MX')}</p></li>)}</ol></CardContent></Card></div>
  </div>
}
