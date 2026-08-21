import { normalizeDoctorClientEmail } from './schemas/client'

export type DoctorClientName = {
  firstName: string
  paternalLastName: string
}

export function doctorFieldsFromProviderName(name: string | null | undefined): DoctorClientName | null {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  if (parts.length < 2) return null

  return {
    firstName: parts[0],
    paternalLastName: parts.slice(1).join(' '),
  }
}

export function doctorAssociationEligibility({
  email,
  emailVerified,
  hasGoogleAccount,
  hasGoogleFlowEvidence,
  name,
}: {
  email: string | null | undefined
  emailVerified: boolean
  hasGoogleAccount: boolean
  hasGoogleFlowEvidence: boolean
  name: string | null | undefined
}) {
  if (!hasGoogleFlowEvidence) return { eligible: false as const, error: 'GOOGLE_FLOW_REQUIRED' as const }
  if (!emailVerified || !hasGoogleAccount || !email?.trim()) return { eligible: false as const, error: 'EMAIL_NOT_VERIFIED' as const }

  const fields = doctorFieldsFromProviderName(name)
  return fields
    ? { eligible: true as const, email: normalizeDoctorClientEmail(email), fields }
    : { eligible: false as const, error: 'PROFILE_REQUIRED' as const }
}
