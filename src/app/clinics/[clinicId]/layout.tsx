import { notFound } from 'next/navigation'

import { requireClinicAccess } from '#/infrastructure/auth/requireClinicAccess'

import { ClinicDashboard } from './clinic-dashboard'

export default async function ClinicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clinicId: string }>
}) {
  const { clinicId } = await params

  try {
    const { clinic, access } = await requireClinicAccess(clinicId)
    return <ClinicDashboard clinic={clinic} isOwner={access.role === 'owner'}>{children}</ClinicDashboard>
  } catch (error) {
    if (error instanceof Error && error.message === 'CLINIC_NOT_FOUND') notFound()
    throw error
  }
}
