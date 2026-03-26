import type { Metadata } from 'next'
import { Providers } from './providers'
import '@/shared/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CMS Admin',
    template: '%s | CMS Admin',
  },
  description: 'CMS 어드민 대시보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
