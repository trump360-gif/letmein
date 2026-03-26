import type { Metadata } from 'next'
import '@/shared/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Beauti',
    template: '%s | Beauti',
  },
  description: 'Beauti CMS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
