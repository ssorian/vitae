'use client'

import type { ReactNode } from 'react'

import {
  SidebarInset,
  SidebarProvider,
} from '#/shared/components/ui/sidebar.tsx'

import { DashboardHeader } from './DashboardHeader.tsx'
import {
  DashboardSidebar,
  type DashboardSidebarProps,
} from './DashboardSidebar.tsx'

type DashboardProps = DashboardSidebarProps & {
  children: ReactNode
}

export function Dashboard({
  items,
  children,
}: DashboardProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar items={items} />

      <SidebarInset>
        <DashboardHeader />

        <main className="flex flex-1 flex-col p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}