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
  text-white
  hover:bg-white/15
  hover:text-white
  data-[active=true]:bg-[var(--brand-pink-deep)]
  data-[active=true]:text-white
  data-[active=true]:font-semibold
`

export function DashboardSidebar({
  items,
}: DashboardSidebarProps) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="
        [--sidebar:var(--brand-pink)]
        [--sidebar-foreground:white]
        [--sidebar-primary:white]
        [--sidebar-primary-foreground:var(--brand-pink)]
        [--sidebar-accent:var(--brand-pink-deep)]
        [--sidebar-accent-foreground:white]
        [--sidebar-border:rgba(255,255,255,0.16)]
        [--sidebar-ring:white]
      "
    >
      <SidebarHeader className="border-b border-white/15">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white">
            <Image src="/image.svg" alt="" width={24} height={24} />
          </div>

          <span className="font-semibold text-white">
            Vitae
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60">
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
                        <Icon className="text-white" />
                        <span className="text-white">
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