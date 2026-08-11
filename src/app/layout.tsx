import type { Metadata } from 'next'

import '#/shared/styles.css'

import { Providers } from './providers'
import { Geist } from "next/font/google";
import { cn } from "#/shared/lib/utils";

import '@fontsource-variable/raleway/wght.css'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Vitae',
  description: 'Vitae',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
