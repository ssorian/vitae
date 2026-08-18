import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'

export const patientPortalInvitationLifetimeMs = 72 * 60 * 60 * 1000

export const patientPortalInvitationInputSchema = z.object({
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
})

export const patientPortalActivationInputSchema = z.object({
  token: z.string().min(1),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/),
  password: z.string().min(8),
})

export function createPatientPortalInvitationToken() {
  return randomBytes(32).toString('base64url')
}

export function hashPatientPortalInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function patientPortalInvitationExpiresAt(now = new Date()) {
  return new Date(now.getTime() + patientPortalInvitationLifetimeMs)
}

export function patientPortalUserEmail(patientId: string, email: string | null) {
  const normalized = email?.trim().toLowerCase()
  return normalized && z.email().safeParse(normalized).success && !normalized.endsWith('.invalid')
    ? normalized
    : `patient-${patientId}@patient.invalid`
}

export function isPatientPortalInvitationUsable(
  invitation: { expiresAt: Date; usedAt: Date | null; revokedAt: Date | null },
  now = new Date(),
) {
  return invitation.usedAt === null && invitation.revokedAt === null && invitation.expiresAt > now
}

export function shouldReplacePatientPortalInvitation(invitation: { usedAt: Date | null; revokedAt: Date | null }) {
  return invitation.usedAt === null && invitation.revokedAt === null
}

export function isPatientPortalOwnershipEligible(account: {
  verifiedAt: Date | null
  revokedAt: Date | null
}) {
  return account.verifiedAt !== null && account.revokedAt === null
}
