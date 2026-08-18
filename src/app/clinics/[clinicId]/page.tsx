import { ClinicOperations } from './operational'
import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'

export default async function ClinicPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params
  const { clinic } = await requireClinicAccess(clinicId)
  return <ClinicOperations clinicId={clinic.id} laboratoryEnabled={clinic.laboratoryEnabled} view="overview" />
}
