import { DoctorClients } from '#/modules/client/DoctorClients'
import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'

export default async function ClinicDoctorsPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params
  const { clinic } = await requireClinicAccess(clinicId)
  return <DoctorClients clinicId={clinic.id} />
}
