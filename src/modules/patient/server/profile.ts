import 'server-only'

import { and, desc, eq, isNotNull } from 'drizzle-orm'

import { db } from '#/infrastructure/database'
import { appointment } from '#/modules/appointment/db/schema'
import { clinic } from '#/modules/clinic/db/schema'
import { order, orderAsset, orderResult } from '#/modules/order/db/schema'
import { patient, patientHistory } from '#/modules/patient/db/schema'

import { bucketPatientAppointments, isPatientResultAssetEligible, isRequestedPatientOwned } from '../profile'

export async function getOwnedPatientProfile(patientId: string, ownedPatientId: string) {
  if (!isRequestedPatientOwned(ownedPatientId, patientId)) return null

  const [identity] = await db.select({
    id: patient.id,
    firstName: patient.firstName,
    paternalLastName: patient.paternalLastName,
    maternalLastName: patient.maternalLastName,
    birthDate: patient.birthDate,
    phone: patient.phone,
    email: patient.email,
  }).from(patient).where(eq(patient.id, patientId))
  if (!identity) return null

  const [appointments, orders] = await Promise.all([
    db.select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      kind: appointment.kind,
      clinicName: clinic.name,
    }).from(appointment).innerJoin(clinic, eq(appointment.clinicId, clinic.id)).where(eq(appointment.patientId, patientId)).orderBy(desc(appointment.startsAt)),
    db.select({
      id: order.id,
      folio: order.folio,
      type: order.type,
      status: order.status,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      clinicName: clinic.name,
      resultFinalizedAt: orderResult.finalizedAt,
      resultRealizedAt: orderResult.realizedAt,
    }).from(order).innerJoin(patientHistory, eq(order.patientHistoryId, patientHistory.id)).innerJoin(clinic, eq(order.clinicId, clinic.id)).leftJoin(orderResult, eq(orderResult.orderId, order.id)).where(eq(patientHistory.patientId, patientId)).orderBy(desc(order.createdAt)),
  ])

  return { identity, ...bucketPatientAppointments(appointments), orders }
}

export async function getOwnedPatientStudy(patientId: string, ownedPatientId: string, orderId: string) {
  if (!isRequestedPatientOwned(ownedPatientId, patientId)) return null

  const [study] = await db.select({
    id: order.id,
    folio: order.folio,
    type: order.type,
    status: order.status,
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt,
    clinicName: clinic.name,
    observations: orderResult.observations,
    resultFinalizedAt: orderResult.finalizedAt,
    resultRealizedAt: orderResult.realizedAt,
  }).from(order).innerJoin(patientHistory, eq(order.patientHistoryId, patientHistory.id)).innerJoin(clinic, eq(order.clinicId, clinic.id)).leftJoin(orderResult, eq(orderResult.orderId, order.id)).where(and(eq(order.id, orderId), eq(patientHistory.patientId, patientId)))

  if (!study) return null

  if (!isPatientResultAssetEligible(study.status, study.resultFinalizedAt)) return { ...study, assets: [] }

  const assets = await db.select({
    id: orderAsset.id,
    name: orderAsset.name,
    type: orderAsset.type,
  }).from(orderAsset)
    .innerJoin(orderResult, eq(orderAsset.orderId, orderResult.orderId))
    .where(and(eq(orderAsset.orderId, study.id), isNotNull(orderResult.finalizedAt)))

  return { ...study, assets }
}
