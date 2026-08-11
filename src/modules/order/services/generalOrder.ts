import { eq } from 'drizzle-orm'

import { db } from '#/infrastructure/database'
import {
  patient,
  patientHistory,
} from '#/modules/patient/db/schema'

import {
  order,
  orderEvent,
  orderResult,
  orderAsset,
} from '#/modules/order/db/schema'

import { doctorClient } from '#/modules/client/db/schema'

import type {
  CreateOrderInput,
} from '#/modules/order/schemas/generalOrder'

export async function findOrganization() {
  return db.query.organization.findFirst()
}

type CreateOrderParams = {
  organizationId: string
  userId?: string | null
  source: 'public' | 'internal'
  data: CreateOrderInput
}

export async function createOrder({
  organizationId,
  userId,
  source,
  data,
}: CreateOrderParams) {
  return db.transaction(async (tx) => {
    const clinicRecord = await tx.query.clinic.findFirst({
      where: {
        id: data.clinicId,
        organizationId,
      },
    })

    if (!clinicRecord) {
      throw new Error('CLINIC_NOT_FOUND')
    }

    /*
     * 1. Find or create DoctorClient
     */
    const existingDoctor = await tx.query.doctorClient.findFirst({
      where: {
        organizationId,
        email: data.doctor.email.trim().toLowerCase(),
      },
    })

    let doctor

    const doctorData = {
      firstName: data.doctor.firstName.trim(),
      paternalLastName: data.doctor.paternalLastName.trim(),
      maternalLastName: data.doctor.maternalLastName?.trim() || null,
      professionalLicense: data.doctor.professionalLicense?.trim() || null,
      specialty: data.doctor.specialty?.trim() || null,
      clinicName: data.doctor.clinicName?.trim() || null,
      phone: data.doctor.phone?.trim() || null,
      email: data.doctor.email.trim().toLowerCase(),
      updatedAt: new Date(),
    }

    if (existingDoctor) {
      const [updatedDoctor] = await tx
        .update(doctorClient)
        .set(doctorData)
        .where(eq(doctorClient.id, existingDoctor.id))
        .returning()
      doctor = updatedDoctor
    } else {
      const [createdDoctor] = await tx
        .insert(doctorClient)
        .values({
          ...doctorData,
          organizationId,
          userId: userId || null,
        })
        .returning()
      doctor = createdDoctor
    }

    /*
     * 2. Find or create Patient
     */
    const birthDateStr = data.patient.birthDate || null

    const existingPatient = await tx.query.patient.findFirst({
      where: {
        AND: [
          { organizationId },
          { firstName: data.patient.firstName.trim() },
          data.patient.paternalLastName?.trim()
            ? { paternalLastName: data.patient.paternalLastName.trim() }
            : { paternalLastName: { isNull: true } },
          data.patient.maternalLastName?.trim()
            ? { maternalLastName: data.patient.maternalLastName.trim() }
            : { maternalLastName: { isNull: true } },
          birthDateStr
            ? { birthDate: birthDateStr }
            : { birthDate: { isNull: true } },
        ],
      },
    })

    let patientRecord
    let history

    if (existingPatient) {
      patientRecord = existingPatient

      const existingHistory = await tx.query.patientHistory.findFirst({
        where: { patientId: existingPatient.id },
      })
      if (!existingHistory) {
        const [createdHistory] = await tx
          .insert(patientHistory)
          .values({ patientId: existingPatient.id })
          .returning()
        history = createdHistory
      } else {
        history = existingHistory
      }
    } else {
      const [createdPatient] = await tx
        .insert(patient)
        .values({
          organizationId,
          firstName: data.patient.firstName.trim(),
          paternalLastName: data.patient.paternalLastName?.trim() || null,
          maternalLastName: data.patient.maternalLastName?.trim() || null,
          birthDate: birthDateStr,
          sex: data.patient.sex || 'unspecified',
          phone: data.patient.phone?.trim() || null,
          email: data.patient.email?.trim() || null,
        })
        .returning()
      patientRecord = createdPatient

      const [createdHistory] = await tx
        .insert(patientHistory)
        .values({ patientId: createdPatient.id })
        .returning()
      history = createdHistory
    }

    /*
     * 3. Folio
     */
    const folio = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    /*
     * 4. Create Order
     */
    const [createdOrder] = await tx
      .insert(order)
      .values({
        organizationId,
        clinicId: data.clinicId,
        doctorClientId: doctor.id,
        patientHistoryId: history.id,
        type: data.type,
        status: source === 'public' ? 'received' : 'draft',
        source,
        folio,
        details: data.details,
        detailsSchemaVersion: 1,
        createdByUserId: userId || null,
      })
      .returning()

    /*
     * 5. Log creation event
     */
    await tx.insert(orderEvent).values({
      orderId: createdOrder.id,
      type: 'order.created',
      userId: userId || null,
      metadata: {},
    })

    return {
      doctorClient: doctor,
      patient: patientRecord,
      patientHistory: history,
      order: createdOrder,
    }
  })
}

export async function listOrders(organizationId: string) {
  return db.query.order.findMany({
    where: { organizationId },
    with: {
      doctorClient: true,
      patientHistory: {
        with: {
          patient: true,
        },
      },
      clinic: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrderDetails(organizationId: string, orderId: string) {
  return db.query.order.findFirst({
    where: {
      organizationId,
      id: orderId,
    },
    with: {
      doctorClient: true,
      patientHistory: {
        with: {
          patient: true,
        },
      },
      clinic: true,
      results: {
        with: {
          finalizedBy: true,
        },
      },
      assets: true,
      events: {
        with: {
          user: true,
        },
      },
    },
  })
}

export async function updateOrderStatus(
  organizationId: string,
  orderId: string,
  status: 'draft' | 'received' | 'scheduled' | 'in_progress' | 'ready' | 'delivered' | 'cancelled',
  userId: string,
) {
  if (status === 'scheduled' || status === 'in_progress') {
    throw new Error('ORDER_STATUS_MANAGED_BY_APPOINTMENT')
  }

  return db.transaction(async (tx) => {
    const existing = await tx.query.order.findFirst({
      where: {
        organizationId,
        id: orderId,
      },
    })

    if (!existing) {
      throw new Error('ORDER_NOT_FOUND')
    }

    const [updated] = await tx
      .update(order)
      .set({
        status,
        updatedAt: new Date(),
        deliveredAt: status === 'delivered' ? new Date() : existing.deliveredAt,
      })
      .where(eq(order.id, orderId))
      .returning()

    // Determine event type
    let eventType: 'order.created' | 'order.scheduled' | 'order.started' | 'result.uploaded' | 'result.finalized' | 'email.sent' | 'order.delivered' | 'order.cancelled' | null = null
    
    if (status === 'delivered') eventType = 'order.delivered'
    if (status === 'cancelled') eventType = 'order.cancelled'

    if (eventType) {
      await tx.insert(orderEvent).values({
        orderId,
        type: eventType,
        userId,
        metadata: {},
      })
    }

    return updated
  })
}

export type AddOrderResultAndAssetsParams = {
  orderId: string
  userId: string
  observations: string
  realizedAt: Date
  assets: {
    name: string
    storageKey: string
    type: 'pdf' | 'image' | 'dicom' | 'zip' | 'other'
    metadata?: Record<string, unknown>
  }[]
}

export async function addOrderResultAndAssets(
  organizationId: string,
  params: AddOrderResultAndAssetsParams,
) {
  return db.transaction(async (tx) => {
    const existingOrder = await tx.query.order.findFirst({
      where: {
        organizationId,
        id: params.orderId,
      },
    })

    if (!existingOrder) {
      throw new Error('ORDER_NOT_FOUND')
    }

    const [result] = await tx
      .insert(orderResult)
      .values({
        orderId: params.orderId,
        observations: params.observations,
        realizedAt: params.realizedAt,
        finalizedAt: new Date(),
        finalizedByUserId: params.userId,
      })
      .returning()

    const createdAssets = []
    for (const asset of params.assets) {
      const [createdAsset] = await tx
        .insert(orderAsset)
        .values({
          orderId: params.orderId,
          name: asset.name,
          storageKey: asset.storageKey,
          type: asset.type,
          metadata: asset.metadata || {},
        })
        .returning()

      createdAssets.push(createdAsset)

      await tx.insert(orderEvent).values({
        orderId: params.orderId,
        type: 'result.uploaded',
        userId: params.userId,
        metadata: { assetId: createdAsset.id, name: asset.name },
      })
    }

    await tx
      .update(order)
      .set({
        status: 'ready',
        updatedAt: new Date(),
      })
      .where(eq(order.id, params.orderId))

    await tx.insert(orderEvent).values({
      orderId: params.orderId,
      type: 'result.finalized',
      userId: params.userId,
      metadata: { resultId: result.id },
    })

    return {
      result,
      assets: createdAssets,
    }
  })
}

export async function deliverOrderResults(
  organizationId: string,
  orderId: string,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const existingOrder = await tx.query.order.findFirst({
      where: {
        organizationId,
        id: orderId,
      },
      with: {
        doctorClient: true,
      },
    })

    if (!existingOrder) {
      throw new Error('ORDER_NOT_FOUND')
    }

    if (existingOrder.status !== 'ready') {
      throw new Error('ORDER_NOT_READY')
    }

    const [updatedOrder] = await tx
      .update(order)
      .set({
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId))
      .returning()

    await tx.insert(orderEvent).values({
      orderId,
      type: 'email.sent',
      userId,
      metadata: {
        to: existingOrder.doctorClient.email,
        subject: `Resultados de estudio listo - Folio ${existingOrder.folio}`,
        secureLink: `/orders/results/${orderId}`,
      },
    })

    await tx.insert(orderEvent).values({
      orderId,
      type: 'order.delivered',
      userId,
      metadata: {},
    })

    console.log(`[MOCK EMAIL] Enviando correo a ${existingOrder.doctorClient.email} para orden Folio ${existingOrder.folio}`)

    return updatedOrder
  })
}

