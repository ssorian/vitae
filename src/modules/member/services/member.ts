import { and, eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'

import { db } from '#/infrastructure/database'
import { account, member, user } from '#/infrastructure/auth/db/schema'
import { clinic } from '#/modules/clinic/db/schema'

export type MemberRole = 'owner' | 'assistant'

export async function requireOwner(organizationId: string, userId: string) {
  const [current] = await db.select().from(member).where(and(eq(member.organizationId, organizationId), eq(member.userId, userId), eq(member.active, true)))
  if (!current || current.role !== 'owner') throw new Error('FORBIDDEN')
  return current
}

export async function listMembers(organizationId: string) {
  return db.select({ id: member.id, role: member.role, active: member.active, assignedClinicId: member.assignedClinicId, name: user.name, email: user.email, clinicName: clinic.name })
    .from(member).innerJoin(user, eq(member.userId, user.id)).leftJoin(clinic, eq(member.assignedClinicId, clinic.id))
    .where(eq(member.organizationId, organizationId))
}

export async function createMember(organizationId: string, input: { name: string; email: string; password: string; role: MemberRole; clinicId?: string }) {
  if (input.role === 'assistant' && !input.clinicId) throw new Error('CLINIC_REQUIRED')
  return db.transaction(async (tx) => {
    if (input.clinicId) {
      const [currentClinic] = await tx.select().from(clinic).where(and(eq(clinic.id, input.clinicId), eq(clinic.organizationId, organizationId), eq(clinic.status, 'active')))
      if (!currentClinic || currentClinic.archivedAt) throw new Error('CLINIC_NOT_FOUND')
    }
    const existing = await tx.select({ id: user.id }).from(user).where(eq(user.email, input.email.toLowerCase()))
    if (existing.length) throw new Error('EMAIL_ALREADY_EXISTS')
    const now = new Date()
    const userId = crypto.randomUUID()
    await tx.insert(user).values({ id: userId, name: input.name, email: input.email.toLowerCase(), emailVerified: false, createdAt: now, updatedAt: now })
    await tx.insert(account).values({ id: crypto.randomUUID(), accountId: userId, providerId: 'credential', userId, password: await hashPassword(input.password), createdAt: now, updatedAt: now })
    const [created] = await tx.insert(member).values({ id: crypto.randomUUID(), userId, organizationId, role: input.role, assignedClinicId: input.role === 'assistant' ? input.clinicId : null, active: true, createdAt: now }).returning()
    return created
  })
}

export async function updateMember(organizationId: string, memberId: string, input: { role: MemberRole; clinicId?: string | null; active?: boolean }) {
  if (input.role === 'assistant' && !input.clinicId) throw new Error('CLINIC_REQUIRED')
  if (input.clinicId) {
    const [currentClinic] = await db.select().from(clinic).where(and(eq(clinic.id, input.clinicId), eq(clinic.organizationId, organizationId), eq(clinic.status, 'active')))
    if (!currentClinic || currentClinic.archivedAt) throw new Error('CLINIC_NOT_FOUND')
  }
  const [updated] = await db.update(member).set({ role: input.role, assignedClinicId: input.role === 'assistant' ? input.clinicId : null, ...(input.active === undefined ? {} : { active: input.active }) }).where(and(eq(member.id, memberId), eq(member.organizationId, organizationId))).returning()
  if (!updated) throw new Error('MEMBER_NOT_FOUND')
  return updated
}
