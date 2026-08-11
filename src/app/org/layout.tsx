'use client'

import { Building2, CalendarDays, ClipboardList, Home, Settings, Users } from 'lucide-react'

import { Dashboard } from '#/shared/components/Dashboard'

const navigation = [
  {
    title: 'Inicio',
    icon: Home,
    to: '/org',
  },
  {
    title: 'Órdenes',
    icon: ClipboardList,
    to: '/org/orders',
  },
  {
    title: 'Agenda',
    icon: CalendarDays,
    to: '/org/appointments',
  },
  {
    title: 'Clínicas',
    icon: Building2,
    to: '/org/clinics',
  },
  {
    title: 'Miembros',
    icon: Users,
    to: '/org/members',
  },
  {
    title: 'Configuración',
    icon: Settings,
    to: '/org/settings',
  },
]

export default function layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Dashboard items={navigation}>
      {children}
    </Dashboard>
  )
}