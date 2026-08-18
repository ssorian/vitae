import { and, asc, eq, isNull, notInArray } from 'drizzle-orm'

import { db } from '#/infrastructure/database/index'
import { order } from '#/modules/order/db/schema'

import { clinic } from '../db/schema'
import type { ClinicInput, PublicBookingSettings } from '../schemas/clinic'
import { randomUUID } from 'crypto'

export async function archiveClinic(organizationId: string, id: string) {
  const [archivedClinic] = await db.update(clinic).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(eq(clinic.id, id), eq(clinic.organizationId, organizationId), isNull(clinic.archivedAt))).returning()
  return archivedClinic
}

export function listClinics(organizationId: string) {
  return db.select().from(clinic).where(and(eq(clinic.organizationId, organizationId), isNull(clinic.archivedAt))).orderBy(asc(clinic.name))
}

export async function createClinic(organizationId: string, input: ClinicInput) {
  const [createdClinic] = await db.insert(clinic).values({ ...input, organizationId, publicSlug: `${toSlug(input.name)}-${randomUUID().slice(0, 8)}` }).returning()
  return createdClinic
}

function toSlug(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'clinica' }

export async function setLaboratoryEnabled(organizationId: string, id: string, laboratoryEnabled: boolean) {
  return db.transaction(async (tx) => {
    if (!laboratoryEnabled) {
      const pending = await tx.select({ id: order.id }).from(order).where(and(eq(order.organizationId, organizationId), eq(order.clinicId, id), notInArray(order.status, ['delivered', 'cancelled'])))
      if (pending.length) throw new Error('LABORATORY_HAS_OPEN_ORDERS')
    }
    const [updated] = await tx.update(clinic).set({ laboratoryEnabled, updatedAt: new Date() }).where(and(eq(clinic.id, id), eq(clinic.organizationId, organizationId), isNull(clinic.archivedAt))).returning()
    if (!updated) throw new Error('CLINIC_NOT_FOUND')
    return updated
  })
}

export async function updateClinicSettings(organizationId: string, id: string, input: PublicBookingSettings & { laboratoryEnabled: boolean }) {
  return db.transaction(async (tx) => {
    const [existingClinic] = await tx.select().from(clinic).where(and(eq(clinic.id, id), eq(clinic.organizationId, organizationId), isNull(clinic.archivedAt)))
    if (!existingClinic) throw new Error('CLINIC_NOT_FOUND')
    if (existingClinic.laboratoryEnabled && !input.laboratoryEnabled) {
      const pending = await tx.select({ id: order.id }).from(order).where(and(eq(order.organizationId, organizationId), eq(order.clinicId, id), notInArray(order.status, ['delivered', 'cancelled'])))
      if (pending.length) throw new Error('LABORATORY_HAS_OPEN_ORDERS')
    }
    const [updatedClinic] = await tx.update(clinic).set({ ...input, updatedAt: new Date() }).where(and(eq(clinic.id, id), eq(clinic.organizationId, organizationId), isNull(clinic.archivedAt))).returning()
    return updatedClinic
  })
}

export async function updateClinic(organizationId: string, id: string, input: ClinicInput) {
  return db.transaction(async (tx) => {
    const [existingClinic] = await tx.select().from(clinic).where(and(eq(clinic.id, id), eq(clinic.organizationId, organizationId), isNull(clinic.archivedAt)))
    if (existingClinic?.laboratoryEnabled && !input.laboratoryEnabled) {
      const pending = await tx.select({ id: order.id }).from(order).where(and(eq(order.organizationId, organizationId), eq(order.clinicId, id), notInArray(order.status, ['delivered', 'cancelled'])))
      if (pending.length) throw new Error('LABORATORY_HAS_OPEN_ORDERS')
    }
    const [updatedClinic] = await tx.update(clinic).set({ ...input, updatedAt: new Date() }).where(and(eq(clinic.id, id), eq(clinic.organizationId, organizationId), isNull(clinic.archivedAt))).returning()
    return updatedClinic
  })
}
