// src/modules/client/db/client.repository.ts

import { eq } from 'drizzle-orm'

import { db } from '#/infrastructure/database'
import { doctorClient } from '../db/schema'

export function findDoctorClientByUserId(
  organizationId: string,
  userId: string,
) {
  return db.query.doctorClient.findFirst({
    where: {
      organizationId,
      userId,
    },
  })
}

export function findDoctorClientByEmail(
  organizationId: string,
  email: string,
) {
  return db.query.doctorClient.findFirst({
    where: {
      organizationId,
      email: email.trim().toLowerCase(),
    },
  })
}

export async function createDoctorClient(
  values: typeof doctorClient.$inferInsert,
) {
  const [created] = await db
    .insert(doctorClient)
    .values(values)
    .returning()

  return created
}

export async function updateDoctorClient(
  id: string,
  values: Partial<typeof doctorClient.$inferInsert>,
) {
  const [updated] = await db
    .update(doctorClient)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(doctorClient.id, id))
    .returning()

  return updated
}