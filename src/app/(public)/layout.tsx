import { and, eq, isNotNull, isNull } from 'drizzle-orm'

import { getSession } from '#/infrastructure/auth/getSession'
import { patientAccount } from '#/infrastructure/auth/db/schema'
import { db } from '#/infrastructure/database'

import { PublicShell } from './PublicShell'

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession()
  const [activePatientAccount] = session?.user
    ? await db.select({ patientId: patientAccount.patientId }).from(patientAccount).where(and(
      eq(patientAccount.userId, session.user.id),
      isNotNull(patientAccount.verifiedAt),
      isNull(patientAccount.revokedAt),
    ))
    : []
  const accountNavigation = activePatientAccount
    ? { href: `/patient/${activePatientAccount.patientId}`, label: 'Mi perfil' }
    : session?.user
      ? { href: '/org', label: 'Acceso' }
      : { href: '/login?redirect=/appointments', label: 'Iniciar sesión' }

  return <PublicShell accountNavigation={accountNavigation}>{children}</PublicShell>
}
