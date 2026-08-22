import type { Metadata } from 'next'

import '#/shared/styles.css'

import { Providers } from './providers'

import '@fontsource-variable/raleway/wght.css'

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
    <html lang="es" className="font-sans">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
