export type PatientAppointment = {
  startsAt: Date
  status: string
}

export function isRequestedPatientOwned(ownedPatientId: string, requestedPatientId: string) {
  return ownedPatientId === requestedPatientId
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function hasValidPatientResultAssetParams(params: { patientId: string; orderId: string; assetId: string }) {
  return uuidPattern.test(params.patientId) && uuidPattern.test(params.orderId) && uuidPattern.test(params.assetId)
}

export function isPatientResultAssetEligible(status: string, finalizedAt: Date | null) {
  return Boolean(finalizedAt) && (status === 'ready' || status === 'delivered')
}

export function bucketPatientAppointments<T extends PatientAppointment>(appointments: T[], now = new Date()) {
  return appointments.reduce<{ upcoming: T[]; history: T[] }>((buckets, appointment) => {
    const isUpcoming = appointment.startsAt >= now && !['completed', 'cancelled', 'rejected', 'no_show'].includes(appointment.status)
    buckets[isUpcoming ? 'upcoming' : 'history'].push(appointment)
    return buckets
  }, { upcoming: [], history: [] })
}

export const appointmentStatusLabels: Record<string, string> = {
  requested: 'Solicitada',
  scheduled: 'Agendada',
  checked_in: 'En recepción',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  rejected: 'Rechazada',
  no_show: 'No asistió',
}

export const orderStatusLabels: Record<string, string> = {
  draft: 'En preparación',
  received: 'Recibida',
  scheduled: 'Agendada',
  in_progress: 'En proceso',
  ready: 'Lista',
  delivered: 'Resultado entregado',
  cancelled: 'Cancelada',
}

export const studyTypeLabels: Record<string, string> = {
  radiography: 'Radiografía',
  cbct: 'CBCT',
}

export function resultStatusLabel(status: string, hasResult: boolean) {
  if (status === 'delivered') return 'Resultado entregado'
  if (status === 'ready' && hasResult) return 'Resultado disponible'
  return orderStatusLabels[status] ?? status
}
