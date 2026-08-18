import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { and, eq, inArray, isNotNull } from 'drizzle-orm'

import { db } from '#/infrastructure/database'
import { order, orderAsset, orderResult } from '#/modules/order/db/schema'
import { patientHistory } from '#/modules/patient/db/schema'

const RESULTS_BUCKET = process.env.SUPABASE_RESULTS_BUCKET || 'order-results'

function requiredEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[name]
  if (!value) throw new Error(`RESULT_DELIVERY_CONFIG_MISSING:${name}`)
  return value
}

function storage() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })
}

export async function getOwnedPatientAssetUrl(patientId: string, ownedPatientId: string, orderId: string, assetId: string) {
  if (patientId !== ownedPatientId) return null

  const [asset] = await db.select({ storageKey: orderAsset.storageKey })
    .from(orderAsset)
    .innerJoin(order, eq(orderAsset.orderId, order.id))
    .innerJoin(patientHistory, eq(order.patientHistoryId, patientHistory.id))
    .innerJoin(orderResult, eq(orderResult.orderId, order.id))
    .where(and(
      eq(orderAsset.id, assetId),
      eq(order.id, orderId),
      eq(patientHistory.patientId, patientId),
      isNotNull(orderResult.finalizedAt),
      inArray(order.status, ['ready', 'delivered']),
    ))
  if (!asset) return null

  const { data, error } = await storage().storage.from(RESULTS_BUCKET).createSignedUrl(asset.storageKey, 60)
  if (error || !data) throw new Error(`RESULT_URL_FAILED:${error?.message ?? 'unknown'}`)
  return data.signedUrl
}
