'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOrganization } from '#/infrastructure/auth/requireOrganization'
import { createMember, listMembers, requireOwner, updateMember } from '../services/member'

const createSchema = z.object({ name: z.string().trim().min(1).max(120), email: z.email(), password: z.string().min(8), role: z.enum(['owner', 'assistant']), clinicId: z.uuid().optional() })
const updateSchema = z.object({ memberId: z.string().min(1), role: z.enum(['owner', 'assistant']), clinicId: z.uuid().nullable().optional(), active: z.boolean().optional() })

export async function listMembersAction() { const context = await requireOrganization(); await requireOwner(context.organizationId, context.user.id); return listMembers(context.organizationId) }
export async function createMemberAction(input: unknown) { const data = createSchema.parse(input); const context = await requireOrganization(); await requireOwner(context.organizationId, context.user.id); const result = await createMember(context.organizationId, data); revalidatePath('/org/members'); return result }
export async function updateMemberAction(input: unknown) { const data = updateSchema.parse(input); const context = await requireOrganization(); await requireOwner(context.organizationId, context.user.id); const result = await updateMember(context.organizationId, data.memberId, data); revalidatePath('/org/members'); return result }
