import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'

import { ClinicSettings } from '../settings'

export default async function ClinicSettingsPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params
  const { clinic, access } = await requireClinicAccess(clinicId)
  return <div className="space-y-6"><div><h2 className="text-xl font-semibold">Configuración</h2><p className="text-sm text-muted-foreground">Administra las opciones operativas de esta clínica.</p></div><ClinicSettings clinicId={clinic.id} enabled={clinic.laboratoryEnabled} publicHours={clinic.publicHours} slotIntervalMinutes={clinic.slotIntervalMinutes} canManage={access.role === 'owner' || access.role === 'assistant'} /></div>
}
