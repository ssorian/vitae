import { and, eq, isNull, asc } from 'drizzle-orm'

import { db } from '#/infrastructure/database/index.ts'

import { clinic } from '../db/schema.ts'
import type { ClinicInput } from '../schemas/clinic.ts'
import { randomUUID } from 'crypto'

export async function archiveClinic(organizationId: string, id: string) {
  const [archivedClinic] = await db
    .update(clinic)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(clinic.id, id),
        eq(clinic.organizationId, organizationId),
        isNull(clinic.archivedAt),
      ),
    )
    .returning()

  return archivedClinic
}

export function listClinics(organizationId: string) {
  return db
    .select()
    .from(clinic)
    .where(
      and(eq(clinic.organizationId, organizationId), isNull(clinic.archivedAt)),
    )
    .orderBy(asc(clinic.name))
}


export async function createClinic(
  organizationId: string,
  input: ClinicInput,
) {
  const [createdClinic] = await db
    .insert(clinic)
    .values({ ...input, organizationId, publicSlug: `${toSlug(input.name)}-${randomUUID().slice(0, 8)}` })
    .returning()

  return createdClinic
}

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'clinica'
}


export async function updateClinic(
  organizationId: string,
  id: string,
  input: ClinicInput,
) {
  const [updatedClinic] = await db
    .update(clinic)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(clinic.id, id),
        eq(clinic.organizationId, organizationId),
        isNull(clinic.archivedAt),
      ),
    )
    .returning()

  return updatedClinic
}
