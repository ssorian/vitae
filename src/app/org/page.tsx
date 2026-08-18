import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { requireOrganization } from '#/infrastructure/auth/requireOrganization'
import { db } from '#/infrastructure/database'
import { member } from '#/infrastructure/auth/db/schema'

export default async function HomePage() {
  const context = await requireOrganization()
  const [access] = await db.select().from(member).where(and(eq(member.organizationId, context.organizationId), eq(member.userId, context.user.id), eq(member.active, true)))
  if (access?.role === 'assistant' && access.assignedClinicId) redirect(`/clinics/${access.assignedClinicId}`)
  if (access?.role !== 'owner') redirect('/login')
  return <div className="flex flex-col gap-4"><h1 className="text-2xl font-bold">Inicio</h1><p>Bienvenido a la página de inicio de la organización.</p></div>
}
