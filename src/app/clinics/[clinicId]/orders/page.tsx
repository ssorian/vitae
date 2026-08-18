import { notFound } from 'next/navigation'

import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'
import { ClinicOperations } from '../operational'

export default async function ClinicOrdersPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params
  const { clinic } = await requireClinicAccess(clinicId)
  if (!clinic.laboratoryEnabled) notFound()
  return <ClinicOperations clinicId={clinic.id} laboratoryEnabled view="orders" />
}
