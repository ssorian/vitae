import { defineRelations } from 'drizzle-orm'

import {
  account,
  invitation,
  member,
  organization,
  patientAccount,
  patientPortalInvitation,
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
  orderResultGrant,
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
    orderResultGrant,
    organization,
    patient,
    patientAccount,
    patientHistory,
    patientPortalInvitation,
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
      resultGrants: t.many.orderResultGrant({
        from: t.order.id,
        to: t.orderResultGrant.orderId,
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
    orderResultGrant: {
      order: t.one.order({
        from: t.orderResultGrant.orderId,
        to: t.order.id,
      }),
      createdBy: t.one.user({
        from: t.orderResultGrant.createdByUserId,
        to: t.user.id,
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
      account: t.one.patientAccount({
        from: t.patient.id,
        to: t.patientAccount.patientId,
      }),
      history: t.one.patientHistory({
        from: t.patient.id,
        to: t.patientHistory.patientId,
      }),
      portalInvitations: t.many.patientPortalInvitation({
        from: t.patient.id,
        to: t.patientPortalInvitation.patientId,
      }),
    },
    patientAccount: {
      patient: t.one.patient({
        from: t.patientAccount.patientId,
        to: t.patient.id,
        optional: false,
      }),
      user: t.one.user({
        from: t.patientAccount.userId,
        to: t.user.id,
        optional: false,
      }),
    },
    patientPortalInvitation: {
      patient: t.one.patient({
        from: t.patientPortalInvitation.patientId,
        to: t.patient.id,
        optional: false,
      }),
      createdBy: t.one.user({
        from: t.patientPortalInvitation.createdByUserId,
        to: t.user.id,
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
    user: {
      patientAccount: t.one.patientAccount({
        from: t.user.id,
        to: t.patientAccount.userId,
      }),
      patientPortalInvitationsCreated: t.many.patientPortalInvitation({
        from: t.user.id,
        to: t.patientPortalInvitation.createdByUserId,
      }),
      resultGrantsCreated: t.many.orderResultGrant({
        from: t.user.id,
        to: t.orderResultGrant.createdByUserId,
      }),
    },
  }),
)
