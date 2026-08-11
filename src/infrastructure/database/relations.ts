import { defineRelations } from 'drizzle-orm'

import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from '#/infrastructure/auth/db/schema'
import { doctorClient } from '#/modules/client/db/schema'
import { clinic } from '#/modules/clinic/db/schema'
import {
  order,
  orderAsset,
  orderEvent,
  orderResult,
} from '#/modules/order/db/schema'
import {
  patient,
  patientHistory,
} from '#/modules/patient/db/schema'

export const relations = defineRelations(
  {
    account,
    clinic,
    doctorClient,
    invitation,
    member,
    order,
    orderAsset,
    orderEvent,
    orderResult,
    organization,
    patient,
    patientHistory,
    session,
    user,
    verification,
  },
  (t) => ({
    doctorClient: {
      orders: t.many.order({
        from: t.doctorClient.id,
        to: t.order.doctorClientId,
      }),
    },
    order: {
      doctorClient: t.one.doctorClient({
        from: t.order.doctorClientId,
        to: t.doctorClient.id,
        optional: false,
      }),
      patientHistory: t.one.patientHistory({
        from: t.order.patientHistoryId,
        to: t.patientHistory.id,
      }),
      clinic: t.one.clinic({
        from: t.order.clinicId,
        to: t.clinic.id,
      }),
      createdBy: t.one.user({
        from: t.order.createdByUserId,
        to: t.user.id,
      }),
      results: t.many.orderResult({
        from: t.order.id,
        to: t.orderResult.orderId,
      }),
      assets: t.many.orderAsset({
        from: t.order.id,
        to: t.orderAsset.orderId,
      }),
      events: t.many.orderEvent({
        from: t.order.id,
        to: t.orderEvent.orderId,
      }),
    },
    orderResult: {
      order: t.one.order({
        from: t.orderResult.orderId,
        to: t.order.id,
      }),
      finalizedBy: t.one.user({
        from: t.orderResult.finalizedByUserId,
        to: t.user.id,
      }),
    },
    orderAsset: {
      order: t.one.order({
        from: t.orderAsset.orderId,
        to: t.order.id,
      }),
    },
    orderEvent: {
      order: t.one.order({
        from: t.orderEvent.orderId,
        to: t.order.id,
      }),
      user: t.one.user({
        from: t.orderEvent.userId,
        to: t.user.id,
      }),
    },
    patient: {
      history: t.one.patientHistory({
        from: t.patient.id,
        to: t.patientHistory.patientId,
      }),
    },
    patientHistory: {
      patient: t.one.patient({
        from: t.patientHistory.patientId,
        to: t.patient.id,
      }),
      orders: t.many.order({
        from: t.patientHistory.id,
        to: t.order.patientHistoryId,
      }),
    },
  }),
)
