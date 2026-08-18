import { and, eq, inArray, isNotNull, type SQL } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

import { db } from '#/infrastructure/database'
import { order, orderAsset, orderEvent, orderResult, orderResultGrant } from '#/modules/order/db/schema'
import { ResultReadyEmail } from '#/modules/order/emails/ResultReadyEmail'
import { createResultAccessCode, createResultGrantToken, hashResultAccessSecret, hasUsableResultGrant, resultGrantExpiresAt, selectResultDeliveryTarget } from '#/modules/order/resultAccess'

const MAX_IMAGE_FILES = 10
const MAX_DICOM_FILES = 500
const MAX_FILE_BYTES = 500 * 1024 * 1024
const MAX_REQUEST_BYTES = 500 * 1024 * 1024
const RESULTS_BUCKET = process.env.SUPABASE_RESULTS_BUCKET || 'order-results'

function requiredEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'RESEND_API_KEY' | 'RESEND_FROM_EMAIL') {
  const value = process.env[name]
  if (!value) throw new Error(`RESULT_DELIVERY_CONFIG_MISSING:${name}`)
  return value
}

function storage() {
  return createClient(
    requiredEnv('SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function assetType(file: File): 'image' | 'dicom' | null {
  const name = file.name.toLowerCase()
  if (file.type === 'image/jpeg' && /\.jpe?g$/.test(name)) return 'image'
  if (/\.(dcm|dicom)$/.test(name)) return 'dicom'
  return null
}

async function hasValidMagicBytes(file: File, type: 'image' | 'dicom') {
  const bytes = new Uint8Array(await file.slice(0, type === 'dicom' ? 132 : 3).arrayBuffer())
  return type === 'image'
    ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : bytes[128] === 0x44 && bytes[129] === 0x49 && bytes[130] === 0x43 && bytes[131] === 0x4d
}

export async function uploadOrderResult(
  organizationId: string,
  userId: string,
  input: { orderId: string; observations: string; realizedAt: Date; files: File[] },
) {
  if (!input.files.length) throw new Error('INVALID_FILE_COUNT')
  const totalBytes = input.files.reduce((total, file) => total + file.size, 0)
  if (totalBytes > MAX_REQUEST_BYTES || input.files.some((file) => file.size > MAX_FILE_BYTES)) throw new Error('FILE_TOO_LARGE')

  const typedFiles = input.files.map((file) => ({ file, type: assetType(file) }))
  if (typedFiles.some(({ type }) => !type)) throw new Error('UNSUPPORTED_FILE_TYPE')
  const dicomFiles = typedFiles.filter(({ type }) => type === 'dicom')
  const imageFiles = typedFiles.filter(({ type }) => type === 'image')
  if (dicomFiles.length > MAX_DICOM_FILES || imageFiles.length > MAX_IMAGE_FILES) throw new Error('INVALID_FILE_COUNT')
  if ((await Promise.all(typedFiles.map(({ file, type }) => hasValidMagicBytes(file, type!)))).some((valid) => !valid)) {
    throw new Error('INVALID_FILE_SIGNATURE')
  }

  const existing = await db.query.order.findFirst({
    where: { id: input.orderId, organizationId },
    with: { results: true },
  })
  if (!existing) throw new Error('ORDER_NOT_FOUND')
  if (existing.results.length) throw new Error('RESULT_ALREADY_FINALIZED')
  if (existing.status === 'delivered' || existing.status === 'cancelled') throw new Error('ORDER_NOT_ACCEPTING_RESULTS')

  const supabase = storage()
  const uploaded: { name: string; storageKey: string; type: 'image' | 'dicom'; metadata: Record<string, unknown> }[] = []
  for (const { file, type } of typedFiles) {
    const storageKey = `${organizationId}/${input.orderId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from(RESULTS_BUCKET).upload(storageKey, file, {
      contentType: file.type || 'application/dicom',
      upsert: false,
    })
    if (error) throw new Error(`RESULT_UPLOAD_FAILED:${error.message}`)
    uploaded.push({ name: file.name, storageKey, type: type!, metadata: { size: file.size } })
  }

  return db.transaction(async (tx) => {
    const alreadyFinalized = await tx.query.orderResult.findFirst({ where: { orderId: input.orderId } })
    if (alreadyFinalized) throw new Error('RESULT_ALREADY_FINALIZED')

    const [result] = await tx.insert(orderResult).values({
      orderId: input.orderId,
      observations: input.observations,
      realizedAt: input.realizedAt,
      finalizedAt: new Date(),
      finalizedByUserId: userId,
    }).returning()

    const assets = await tx.insert(orderAsset).values(uploaded.map((asset) => ({ orderId: input.orderId, ...asset }))).returning()
    await tx.update(order).set({ status: 'ready', updatedAt: new Date() }).where(eq(order.id, input.orderId))
    await tx.insert(orderEvent).values([
      ...assets.map((asset) => ({ orderId: input.orderId, type: 'result.uploaded' as const, userId, metadata: { assetId: asset.id, name: asset.name } })),
      { orderId: input.orderId, type: 'result.finalized', userId, metadata: { resultId: result.id } },
    ])
    return { result, assets }
  })
}

export async function deliverOrderResults(organizationId: string, orderId: string, userId: string) {
  const existing = await db.query.order.findFirst({
    where: { id: orderId, organizationId },
    with: { patientHistory: { with: { patient: { with: { account: { with: { user: true } } } } } }, results: true },
  })
  if (!existing) throw new Error('ORDER_NOT_FOUND')
  if (existing.status !== 'ready' || !existing.results.length) throw new Error('ORDER_NOT_READY')

  const patient = existing.patientHistory?.patient
  if (!patient) throw new Error('PATIENT_NOT_FOUND')
  const target = selectResultDeliveryTarget({ patientId: patient.id, patientEmail: patient.email, account: patient.account })
  let resultUrl: string
  let recipient: string | null = null
  let accessCode: string | null = null
  if (target.kind === 'account') {
    resultUrl = `${process.env.BETTER_AUTH_URL}/patient/${target.patientId}/studies/${orderId}`
    recipient = target.email
    const { error } = await new Resend(requiredEnv('RESEND_API_KEY')).emails.send({ from: requiredEnv('RESEND_FROM_EMAIL'), to: recipient, subject: `Resultados de estudio listos - Folio ${existing.folio}`, react: ResultReadyEmail({ folio: existing.folio, resultUrl }) })
    if (error) throw new Error(`RESULT_EMAIL_FAILED:${error.message}`)
  } else if (target.kind === 'email') {
    const token = createResultGrantToken()
    const [grant] = await db.insert(orderResultGrant).values({ orderId, kind: 'email', secretHash: hashResultAccessSecret(token), expiresAt: resultGrantExpiresAt(), createdByUserId: userId }).returning()
    resultUrl = `${process.env.BETTER_AUTH_URL}/order/access/${token}`
    recipient = target.email
    try {
      const { error } = await new Resend(requiredEnv('RESEND_API_KEY')).emails.send({ from: requiredEnv('RESEND_FROM_EMAIL'), to: recipient, subject: `Resultados de estudio listos - Folio ${existing.folio}`, react: ResultReadyEmail({ folio: existing.folio, resultUrl }) })
      if (error) throw new Error(`RESULT_EMAIL_FAILED:${error.message}`)
    } catch (error) {
      await db.update(orderResultGrant).set({ revokedAt: new Date() }).where(eq(orderResultGrant.id, grant.id))
      throw error
    }
  } else {
    accessCode = createResultAccessCode()
    try {
      await db.insert(orderResultGrant).values({ orderId, kind: 'code', secretHash: hashResultAccessSecret(accessCode), expiresAt: resultGrantExpiresAt(), createdByUserId: userId })
    } catch {
      throw new Error('ORDER_ACCESS_CODE_ALREADY_ISSUED')
    }
    resultUrl = '/order'
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx.update(order).set({ status: 'delivered', deliveredAt: new Date(), updatedAt: new Date() }).where(and(eq(order.id, orderId), eq(order.status, 'ready'))).returning()
    if (!updated) throw new Error('ORDER_NOT_READY')
    await tx.insert(orderEvent).values([
      ...(recipient ? [{ orderId, type: 'email.sent' as const, userId, metadata: { to: recipient, subject: `Resultados de estudio listos - Folio ${existing.folio}`, secureLink: '/order/access/[redacted]' } }] : []),
      { orderId, type: 'order.delivered' as const, userId, metadata: {} },
    ])
    return { order: updated, accessCode }
  })
}

async function findUsableGrant(where: SQL) {
  const [found] = await db.select({ grant: orderResultGrant, order, result: orderResult }).from(orderResultGrant).innerJoin(order, eq(orderResultGrant.orderId, order.id)).innerJoin(orderResult, eq(orderResult.orderId, order.id)).where(and(where, inArray(order.status, ['ready', 'delivered']), isNotNull(orderResult.finalizedAt)))
  return found && hasUsableResultGrant(found.grant) ? found : null
}

export async function getGrantedOrder(orderId: string, grantId: string) {
  const found = await findUsableGrant(and(eq(orderResultGrant.id, grantId), eq(orderResultGrant.orderId, orderId))!)
  if (!found) return null
  const assets = await db.select().from(orderAsset).where(eq(orderAsset.orderId, orderId))
  return { ...found.order, results: [found.result], assets }
}

export async function getGrantedOrderBySecret(secret: string) {
  return findUsableGrant(eq(orderResultGrant.secretHash, hashResultAccessSecret(secret)))
}

export async function getGrantedOrderByFolioCode(folio: string, code: string) {
  const found = await findUsableGrant(eq(orderResultGrant.secretHash, hashResultAccessSecret(code)))
  return found && found.grant.kind === 'code' && found.order.folio === folio.trim().toUpperCase() ? found : null
}

export async function getGrantedAssetUrl(orderId: string, grantId: string, assetId: string) {
  const found = await getGrantedOrder(orderId, grantId)
  const asset = found?.assets.find((item) => item.id === assetId)
  if (!asset) return null
  const { data, error } = await storage().storage.from(RESULTS_BUCKET).createSignedUrl(asset.storageKey, 60)
  if (error || !data) throw new Error(`RESULT_URL_FAILED:${error?.message ?? 'unknown'}`)
  return data.signedUrl
}

export async function getDoctorResult(orderId: string, email: string) {
  const found = await db.query.order.findFirst({
    where: { id: orderId, status: 'delivered' },
    with: { doctorClient: true, results: true, assets: true },
  })
  if (!found || normalizeEmail(found.doctorClient.email) !== normalizeEmail(email) || found.results.length !== 1) return null
  return found
}

async function signedViewerAssets(assets: { id: string; name: string; type: string; storageKey: string }[]) {
  return Promise.all(assets.filter((asset): asset is typeof asset & { type: 'dicom' | 'image' } => asset.type === 'dicom' || asset.type === 'image').map(async (asset) => {
    const { data, error } = await storage().storage.from(RESULTS_BUCKET).createSignedUrl(asset.storageKey, 60)
    if (error || !data) throw new Error(`RESULT_URL_FAILED:${error?.message ?? 'unknown'}`)
    return { id: asset.id, name: asset.name, type: asset.type, url: data.signedUrl }
  }))
}

export async function getOrganizationViewerAssets(organizationId: string, orderId: string) {
  const found = await db.query.order.findFirst({
    where: { id: orderId, organizationId },
    with: { assets: true },
  })
  if (!found) return null
  return { type: found.type, assets: await signedViewerAssets(found.assets) }
}

export async function getDoctorViewerAssets(orderId: string, email: string) {
  const found = await getDoctorResult(orderId, email)
  if (!found) return null
  return { type: found.type, assets: await signedViewerAssets(found.assets) }
}

export async function getDoctorAssetUrl(orderId: string, assetId: string, email: string) {
  const found = await getDoctorResult(orderId, email)
  const asset = found?.assets.find((item) => item.id === assetId)
  if (!asset) return null
  const { data, error } = await storage().storage.from(RESULTS_BUCKET).createSignedUrl(asset.storageKey, 60)
  if (error || !data) throw new Error(`RESULT_URL_FAILED:${error?.message ?? 'unknown'}`)
  return data.signedUrl
}
