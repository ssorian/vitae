'use client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanstackQueryProvider } from '#/infrastructure/integrations/devtools'
import { TooltipProvider } from '#/shared/components/ui/tooltip'


export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TanstackQueryProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </TanstackQueryProvider>
  )
}
