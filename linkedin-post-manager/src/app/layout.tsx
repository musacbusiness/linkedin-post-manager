import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/error-boundary'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'LinkedIn Post Manager',
  description: 'AI-powered LinkedIn post management with Supabase and Claude',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
