import { Bell } from 'lucide-react'

import { Button } from '#/shared/components/ui/button'
import { Separator } from '#/shared/components/ui/separator'
import { SidebarTrigger } from '#/shared/components/ui/sidebar'

export function DashboardHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />

      <Separator
        orientation="vertical"
        className="h-4"
      />

      <div className="flex flex-1 items-center justify-end">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ver notificaciones"
        >
          <Bell aria-hidden="true" />
        </Button>
      </div>
    </header>
  )
}