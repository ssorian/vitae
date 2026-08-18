import { and, eq, isNull } from 'drizzle-orm'
import { db } from '#/infrastructure/database'
import { member } from './db/schema'
import { clinic } from '#/modules/clinic/db/schema'
import { requireOrganization } from './requireOrganization'

export async function requireClinicAccess(clinicId: string, ownerOnly = false) {
  const context = await requireOrganization()
  const [access] = await db.select().from(member).where(and(eq(member.organizationId, context.organizationId), eq(member.userId, context.user.id), eq(member.active, true)))
  if (!access || (ownerOnly && access.role !== 'owner')) throw new Error('FORBIDDEN')
  if (access.role === 'assistant' && access.assignedClinicId !== clinicId) throw new Error('FORBIDDEN')
  if (!['owner', 'assistant'].includes(access.role)) throw new Error('FORBIDDEN')
  const [currentClinic] = await db.select().from(clinic).where(and(eq(clinic.id, clinicId), eq(clinic.organizationId, context.organizationId), eq(clinic.status, 'active'), isNull(clinic.archivedAt)))
  if (!currentClinic) throw new Error('CLINIC_NOT_FOUND')
  return { ...context, access, clinic: currentClinic }
}
