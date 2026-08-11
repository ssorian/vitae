import type { ReactNode } from 'react'

import { cn } from '#/shared/lib/utils.ts'

export function AuthLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        'flex min-h-svh items-center justify-center bg-muted p-6 md:p-10',
        className,
      )}
    >
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
