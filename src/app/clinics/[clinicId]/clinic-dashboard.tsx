'use client'

import { CalendarDays, ClipboardList, Home, Settings, Users, Building2 } from 'lucide-react'

import { Dashboard } from '#/shared/components/Dashboard'

export function ClinicDashboard({
  clinic,
  isOwner,
  children,
}: {
  clinic: { id: string; name: string; laboratoryEnabled: boolean; status: string }
  isOwner: boolean
  children: React.ReactNode
}) {
  const basePath = `/clinics/${clinic.id}`
  const items = [
    { title: 'Inicio', icon: Home, to: basePath },
    { title: 'Agenda', icon: CalendarDays, to: `${basePath}/agenda` },
    { title: 'Pacientes e historial', icon: Users, to: `${basePath}/patients` },
    { title: 'Doctores clientes', icon: Users, to: `${basePath}/doctors` },
    ...(clinic.laboratoryEnabled ? [{ title: 'Órdenes', icon: ClipboardList, to: `${basePath}/orders` }] : []),
    { title: 'Configuración', icon: Settings, to: `${basePath}/settings` },
    ...(isOwner ? [{ title: 'Volver a clínicas', icon: Building2, to: '/org/clinics' }] : []),
  ]

  return (
    <Dashboard items={items}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
        <header className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Panel operativo</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{clinic.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border px-3 py-1.5 text-muted-foreground">{clinic.status === 'active' ? 'Clínica activa' : 'Clínica inactiva'}</span>
            <span className="rounded-full border px-3 py-1.5 text-muted-foreground">{clinic.laboratoryEnabled ? 'Laboratorio habilitado' : 'Sin laboratorio'}</span>
          </div>
        </header>
        {children}
      </div>
    </Dashboard>
  )
}
