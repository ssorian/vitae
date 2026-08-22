'use client'

import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '#/shared/components/ui/sidebar'

export type NavigationItem = {
  title: string
  icon: LucideIcon
  to: string
  active?: boolean
}

export type DashboardSidebarProps = {
  items: NavigationItem[]
}

const menuButtonClassName = `
  text-sidebar-foreground
  hover:bg-sidebar-accent
  hover:text-sidebar-accent-foreground
  data-[active=true]:bg-sidebar-accent
  data-[active=true]:text-sidebar-accent-foreground
  data-[active=true]:font-semibold
`

export function DashboardSidebar({
  items,
}: DashboardSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Image src="/image.svg" alt="" width={24} height={24} />
          </div>

          <span className="font-semibold text-sidebar-foreground">
            Vitae
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            Navegación
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      tooltip={item.title}
                      className={menuButtonClassName}
                    >
                      <Link href={item.to}>
                        <Icon />
                        <span>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}