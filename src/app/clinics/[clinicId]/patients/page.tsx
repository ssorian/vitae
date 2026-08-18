import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { ClinicOperations } from '../operational'

export default async function ClinicPatientsPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params
  const { clinic } = await requireClinicAccess(clinicId)
  return <ClinicOperations clinicId={clinic.id} laboratoryEnabled={clinic.laboratoryEnabled} view="patients" />
}
